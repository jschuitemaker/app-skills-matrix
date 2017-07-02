import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Grid, Row, Alert, Col, Jumbotron, Button } from 'react-bootstrap';
import { Link } from 'react-router';
import R from 'ramda';

import * as selectors from '../../../modules/user';
import { actions, SKILL_STATUS, EVALUATION_VIEW, EVALUATION_STATUS, EVALUATION_FETCH_STATUS } from '../../../modules/user/evaluations';
const { SUBJECT, MENTOR, ADMIN } = EVALUATION_VIEW;
const { NEW, SELF_EVALUATION_COMPLETE } = EVALUATION_STATUS;

import Evaluation from './evaluation/Evaluation';
import EvaluationPageHeader from './EvaluationPageHeader';
import Matrix from '../../common/matrix/Matrix';

import './evaluation.scss'

class EvaluationPageComponent extends React.Component {
  constructor(props) {
    super(props);

    this.updateSkillStatus = this.updateSkillStatus.bind(this);
  }

  componentDidMount() {
    const { params: { evaluationId }, fetchStatus, actions } = this.props;

    if (!fetchStatus) {
      actions.retrieveEvaluation(evaluationId)
    }
  }

  updateSkillStatus(evaluationView) {
    return (skillId, newStatus) =>
      this.props.actions.updateSkillStatus(evaluationView, this.props.evaluationId, skillId, newStatus);
  }

  render() {
    const { levels, categories, status, skillGroups, skills, view, params, fetchStatus } = this.props;
    const { evaluationId } = params;

    if (fetchStatus !== EVALUATION_FETCH_STATUS.LOADED) {
      return false;
    }

    if (view === SUBJECT && status === NEW) {
      return (
        <Evaluation
          evaluationId={evaluationId}
          view={view}
          levels={levels}
          skills={skills}
          skillGroups={skillGroups}
          status={status}
        />
      );
    }

    return (
      <div className='evaluation-grid'>
        <div className='evaluation-grid__item'>
          <EvaluationPageHeader
            evaluationId={evaluationId}
          />
        </div>
        <div className='evaluation-grid__item'>
          <Row>
            <Col md={20}>
              <Matrix
                categories={categories}
                levels={R.reverse(levels)}
                skillGroups={skillGroups}
                updateSkillStatus={this.updateSkillStatus}
                canUpdateSkillStatus={
                view === SUBJECT && status === NEW
                || view === MENTOR && status === SELF_EVALUATION_COMPLETE
                }
                skills={skills}
              />
            </Col>
          </Row>
        </div>
      </div>
    )
  }
}

EvaluationPageComponent.propTypes = {
  status: PropTypes.string,
  levels: PropTypes.array,
  categories: PropTypes.array,
  skillGroups: PropTypes.object,
  skills: PropTypes.object,
  view: PropTypes.string,
  error: PropTypes.object,
  params: PropTypes.shape({
    evaluationId: PropTypes.string.isRequired
  })
};

export const EvaluationPage = connect(
  function mapStateToProps(state, props) {
    const evalId = props.params.evaluationId;

    return ({
      error: selectors.getError(state, evalId),
      fetchStatus: selectors.getEvaluationFetchStatus(state, evalId),
      status: selectors.getEvaluationStatus(state, evalId),
      levels: selectors.getLevels(state, evalId),
      categories: selectors.getCategories(state, evalId),
      skillGroups: selectors.getSkillGroups(state, evalId),
      skills: selectors.getSkills(state, evalId),
      view: selectors.getView(state, evalId),
    });
  },
  function mapDispatchToProps(dispatch) {
    return {
      actions: bindActionCreators(actions, dispatch)
    };
  }
)(EvaluationPageComponent);
