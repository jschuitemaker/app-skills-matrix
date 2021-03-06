import * as Promise from 'bluebird';
import * as validate from 'express-validation';
import * as Joi from 'joi';
import { ensureLoggedIn, getRequestedEvaluation, getUserPermissions, Locals } from '../middlewares/auth';

import evaluations from '../models/evaluations/index';
import { Evaluation, EvaluationUpdate } from '../models/evaluations/evaluation';
import users from '../models/users/index';
import { User } from '../models/users/user';
import { Users } from '../models/users/users';
import actions from '../models/actions/index';
import notes from '../models/notes';
import { Notes } from '../models/notes/notes';

import sendMail from '../services/email/index';
import {
  SKILL_NOT_FOUND,
  MUST_BE_NOTE_AUTHOR,
  NOTE_NOT_FOUND,
} from './errors';

const addActions = (user: User, skill, evaluation, newStatus: string) => {
  const actionToAdd = skill.addAction(newStatus);
  const actionToRemove = skill.removeAction(newStatus);
  const fns = [];
  if (actionToAdd) {
    fns.push(actions.addAction(actionToAdd, user, skill, evaluation));
  }
  if (actionToRemove) {
    fns.push(actions.removeAction(actionToRemove, user.id, skill.id, evaluation.id));
  }
  return Promise.all(fns);
};

const buildAggregateViewModel = (evaluation: Evaluation, retrievedNotes: Notes, retrievedUsers: Users, reqUser: User, evaluationUser: User): Promise<HydratedEvaluationViewModel> => {
  const augment = viewModel => ({
    ...viewModel,
    users: retrievedUsers.normalizedViewModel(),
    notes: retrievedNotes.normalizedViewModel(),
  });

  if (reqUser.id === evaluation.user.id) {
    return augment(evaluation.subjectEvaluationViewModel());
  }

  // NOTE: this must be first or bad things happen
  if (reqUser.id === evaluationUser.mentorId && reqUser.id === evaluationUser.lineManagerId) {
    return augment(evaluation.lineManagerAndMentorEvaluationViewModel());
  }

  if (reqUser.id === evaluationUser.mentorId) {
    return augment(evaluation.mentorEvaluationViewModel());
  }

  if (reqUser.id === evaluationUser.lineManagerId) {
    return augment(evaluation.lineManagerEvaluationViewModel());
  }

  if (reqUser.isAdmin) {
    return augment(evaluation.adminEvaluationViewModel());
  }
};

const handlerFunctions = Object.freeze({
  evaluation: {
    retrieve: (req, res, next) => {
      const { user, permissions, requestedEvaluation, evaluationUser } = <Locals>res.locals;

      return permissions.viewEvaluation()
        .then(requestedEvaluation.getNoteIds)
        .then(notes.getNotes)
        .then(retrievedNotes =>
          users.getUsersById(retrievedNotes.getUserIds())
            .then(retrievedUsers => buildAggregateViewModel(requestedEvaluation, retrievedNotes, retrievedUsers, user, evaluationUser)))
        .then(viewModel => res.status(200).json(viewModel))
        .catch(next);
    },
    updateSkillStatus: {
      middleware: [
        ensureLoggedIn,
        getRequestedEvaluation,
        getUserPermissions,
      ],
      handle: (req, res, next) => {
        const { skillId, status } = req.body;
        const { evaluationUser, permissions, requestedEvaluation } = <Locals>res.locals;


        const skill = requestedEvaluation.findSkill(skillId);
        if (!skill) {
          return res.status(400).json(SKILL_NOT_FOUND());
        }

        const changes = requestedEvaluation.updateSkill(skillId, status, permissions.isSubject, permissions.isMentor, permissions.isLineManager);
        if (changes.error) {
          return res.status(400).json(changes);
        }

        permissions.updateSkill()
          .then(() => evaluations.updateEvaluation(<EvaluationUpdate>changes))
          .then(() => addActions(evaluationUser, skill, requestedEvaluation, status))
          .then(() => res.sendStatus(204))
          .catch(next);
      },
    },
    adminUpdateSkillStatus: {
      middleware: [
        ensureLoggedIn,
        getRequestedEvaluation,
        getUserPermissions,
      ],
      handle:
        (req, res, next) => {
          const { skillId, status } = req.body;
          const { evaluationUser, permissions, requestedEvaluation } = <Locals>res.locals;

          const skill = requestedEvaluation.findSkill(skillId);
          if (!skill) {
            return res.status(400).json(SKILL_NOT_FOUND());
          }

          // naughty admins
          const updatedEvaluation = requestedEvaluation.updateSkill(skillId, status, true, true, true);
          return permissions.admin()
            .then(() => evaluations.updateEvaluation(<EvaluationUpdate>updatedEvaluation))
            .then(() => addActions(evaluationUser, skill, requestedEvaluation, status))
            .then(() => res.sendStatus(204))
            .catch(next);
        },
    },
    complete: {
      middleware: [
        ensureLoggedIn,
        getRequestedEvaluation,
        getUserPermissions,
      ],
      handle:
        (req, res, next) => {
          const { requestedEvaluation, evaluationUser, permissions } = <Locals>res.locals;

          permissions.completeEvaluation()
            .then(() => {
              const changes = requestedEvaluation.moveToNextStatus(permissions.isSubject, permissions.isMentor, permissions.isLineManager);
              if (changes.error) {
                return res.status(400).json(changes);
              }

              return Promise.all([
                evaluations.updateEvaluation(<EvaluationUpdate>changes),
                users.getUserById(evaluationUser.mentorId),
                users.getUserById(evaluationUser.lineManagerId),
              ]).then(([updatedEvaluation, mentor, lineManager]) => {
                if (permissions.isSubject) {
                  sendMail(updatedEvaluation.getSelfEvaluationCompleteEmail(mentor))
                    .catch(console.error);
                  return res.status(200).json(updatedEvaluation.subjectMetadataViewModel());
                }

                if (permissions.isMentor && permissions.isLineManager) {
                  return res.status(200).json(updatedEvaluation.lineManagerAndMentorMetadataViewModel());
                }

                if (permissions.isMentor) {
                  sendMail(updatedEvaluation.getMentorReviewCompleteEmail(lineManager))
                    .catch(console.error);
                  return res.status(200).json(updatedEvaluation.mentorMetadataViewModel());
                }
                if (permissions.isLineManager) {
                  return res.status(200).json(updatedEvaluation.lineManagerMetadataViewModel());
                }
              });
            })
            .catch(next);
        },
    },
    addNote: {
      middleware: [
        ensureLoggedIn,
        getRequestedEvaluation,
        getUserPermissions,
        validate({
          params: {
            evaluationId: Joi.string().required(),
          },
          body: {
            note: Joi.string().required(),
            skillId: Joi.number().required(),
          },
        }),
      ],
      handle:
        (req, res, next) => {
          const { skillId, note: noteText } = req.body;
          const { user, requestedEvaluation, permissions } = <Locals>res.locals;

          const skill = requestedEvaluation.findSkill(skillId);
          if (!skill) {
            return res.status(400).json(SKILL_NOT_FOUND());
          }

          permissions.addNote()
            .then(() => notes.addNote(user.id, skillId, noteText))
            .then(note =>
              evaluations.updateEvaluation(requestedEvaluation.addSkillNote(skillId, note.id))
                .then(() => res.status(200).json(note.viewModel())))
            .catch(next);
        },
    },
    deleteNote: {
      middleware: [
        ensureLoggedIn,
        getRequestedEvaluation,
        validate({
          params: {
            evaluationId: Joi.string().required(),
          },
          body: {
            noteId: Joi.string().required(),
            skillId: Joi.number().required(),
          },
        }),
      ],
      handle:
        (req, res, next) => {
          const { skillId, noteId } = req.body;
          const { user, requestedEvaluation } = <Locals>res.locals;

          Promise.try(() => notes.getNote(noteId))
            .then((note) => {
              if (!note) {
                return res.status(400).json(NOTE_NOT_FOUND());
              }

              // not part of the permission model - could do, but it adds complexity that might not be worth it
              if (note.userId !== user.id) {
                return res.status(403).json(MUST_BE_NOTE_AUTHOR());
              }

              const skill = requestedEvaluation.findSkill(skillId);
              if (!skill) {
                throw ({ status: 400, data: SKILL_NOT_FOUND() });
              }

              return evaluations.updateEvaluation(requestedEvaluation.deleteSkillNote(skillId, noteId))
                .then(() => notes.updateNote(note.setDeletedFlag()))
                .then(() => res.sendStatus(204));
            })
            .catch(err =>
              (err.status && err.data) ? res.status(err.status).json(err.data) : next(err));
        },
    },
    updateEvaluationStatus: {
      middleware: [
        ensureLoggedIn,
        getRequestedEvaluation,
        getUserPermissions,
      ],
      handle: (req, res, next) => {
        const { status } = req.body;
        const { permissions, requestedEvaluation } = <Locals>res.locals;
        const update = requestedEvaluation.updateStatus(status);

        if (update.error) {
          return res.status(400).json(update);
        }

        return permissions.admin()
          .then(() => evaluations.updateEvaluation(<EvaluationUpdate>update))
          .then(updatedEvaluation => res.status(200).json(updatedEvaluation.adminMetadataViewModel()))
          .catch(next);
      },
    },
  },
});

export default handlerFunctions;
