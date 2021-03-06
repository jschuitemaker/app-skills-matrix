import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Grid, Row, Alert, Col } from 'react-bootstrap';

import * as selectors from '../../../modules/user';
import {
  actionCreators as evaluationsActionCreators,
  EVALUATION_VIEW,
  EVALUATION_STATUS,
  EVALUATION_FETCH_STATUS,
} from '../../../modules/user/evaluations';
import { actionCreators as skillsActionCreators, NEWLY_ATTAINED } from '../../../modules/user/skills';
import { actionCreators as matrixFilterActionCreators } from '../../../modules/user/ui/matrixFilters';

import Evaluation from './evaluation/Evaluation';
import EvaluationPageHeader from './EvaluationPageHeader';
import Matrix from '../matrix/Matrix';
import Filters from '../matrix/Filters';

import './evaluation.scss';

const { SUBJECT, MENTOR, ADMIN, LINE_MANAGER, LINE_MANAGER_AND_MENTOR } = EVALUATION_VIEW;
const { NEW, SELF_EVALUATION_COMPLETE, MENTOR_REVIEW_COMPLETE } = EVALUATION_STATUS;

type EvaluationPageComponentProps = {
  status?: string,
  levels?: string[],
  categories?: string[],
  skillGroups: UnhydratedSkillGroup[],
  view: string,
  error?: { message?: string },
  params: {
    evaluationId: string,
  },
  fetchStatus: boolean,
  evalActions: typeof evaluationsActionCreators,
  skillActions: typeof skillsActionCreators,
  matrixFilterActions: typeof matrixFilterActionCreators,
  matrixSkillsStatusFilter: (string) => string[],
  currentFilter: string,
};

const loadEvaluation = ({ params: { evaluationId }, fetchStatus, evalActions }) => {
  if (!fetchStatus) {
    evalActions.retrieveEvaluation(evaluationId);
  }
};

class EvaluationPageComponent extends React.Component<EvaluationPageComponentProps, any> {
  constructor(props) {
    super(props);

    this.updateSkillStatus = this.updateSkillStatus.bind(this);
    this.updateFilter = this.updateFilter.bind(this);
  }

  componentDidMount() {
    loadEvaluation(this.props);

  }

  componentWillReceiveProps(nextProps) {
    loadEvaluation(nextProps);
  }

  updateSkillStatus(skillId, newSkillStatus, skillUid) {
    const { skillActions, view, params: { evaluationId } } = this.props;

    return skillActions.updateSkillStatus(view, evaluationId, skillId, newSkillStatus, skillUid);
  }

  updateFilter(evaluationId, filter, idsToShow) {
    const { matrixFilterActions } = this.props;

    return matrixFilterActions.updateFilter(evaluationId, filter, idsToShow);
  }

  render() {
    const { error, levels, categories, status, skillGroups, view, params: { evaluationId }, fetchStatus, matrixSkillsStatusFilter, currentFilter } = this.props;

    if (error) {
      return (
        <Grid>
          <Row>
            <Alert bsStyle="danger">Something went wrong: {error.message}</Alert>
          </Row>
        </Grid>
      );
    }

    if (fetchStatus !== EVALUATION_FETCH_STATUS.LOADED) {
      return false;
    }

    if (view === SUBJECT && status === NEW) {
      return (
        <Evaluation
          evaluationId={evaluationId}
          view={view}
          categories={categories}
          levels={levels}
          status={status}
          updateSkillStatus={this.updateSkillStatus}
        />
      );
    }

    return (
      <div className="evaluation-grid">
        <div className="evaluation-grid__item">
          <EvaluationPageHeader
            evaluationId={evaluationId}
          />
        </div>
        <div className="evaluation-grid__item">
          <Row>
            <div className="skill--legend--container">
              <p className="skill--legend skill--new state--icon--NEW">New skill</p>
            </div>
            <Filters
                evaluationId={evaluationId}
                updateFilter={this.updateFilter}
                getMatrixSkillsStatusFilter={matrixSkillsStatusFilter}
                currentFilter={currentFilter}
            />
          </Row>
          <Row>
            <Col md={20}>
              <Matrix
                evaluationId={evaluationId}
                categories={categories}
                levels={levels}
                skillGroups={skillGroups}
                updateSkillStatus={this.updateSkillStatus}
                canUpdateSkillStatus={
                  view === ADMIN
                  || (view === SUBJECT && status === NEW)
                  || (view === MENTOR && status === SELF_EVALUATION_COMPLETE)
                  || (view === LINE_MANAGER && status === MENTOR_REVIEW_COMPLETE)
                  || (view === LINE_MANAGER_AND_MENTOR && (status === MENTOR_REVIEW_COMPLETE || status === SELF_EVALUATION_COMPLETE))
                }
              />
            </Col>
          </Row>
        </div>
      </div>
    );
  }
}

export const EvaluationPage = connect(
  (state, props) => {
    const evalId = props.params.evaluationId;

    return ({
      error: selectors.getError(state, evalId),
      fetchStatus: selectors.getEvaluationFetchStatus(state, evalId),
      status: selectors.getEvaluationStatus(state, evalId),
      levels: selectors.getLevels(state, evalId),
      categories: selectors.getCategories(state, evalId),
      skillGroups: selectors.getSkillGroups(state, evalId),
      view: selectors.getView(state, evalId),
      matrixSkillsStatusFilter: (skillStatus) => {
        const currentFilter = selectors.getCurrentFilter(state, evalId);
        const isFiltered = currentFilter && currentFilter === skillStatus;
        const skillUids = selectors.getSkillUids(state, evalId);
        if (isFiltered) return skillUids;
        return skillStatus === NEWLY_ATTAINED ? selectors.getNewlyAttainedSkills(state, skillUids) : selectors.getSkillsWithCurrentStatus(state, skillStatus, skillUids);
      },
      currentFilter: selectors.getCurrentFilter(state, evalId),
    });
  },
  dispatch => ({
    evalActions: bindActionCreators(evaluationsActionCreators, dispatch),
    skillActions: bindActionCreators(skillsActionCreators, dispatch),
    matrixFilterActions: bindActionCreators(matrixFilterActionCreators, dispatch),
  }),
)(EvaluationPageComponent);
