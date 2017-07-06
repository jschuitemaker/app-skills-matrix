import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import R from 'ramda';
import { Grid, Col, Row, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router';

import * as selectors from '../../../../modules/user'
import { actions, SKILL_STATUS, EVALUATION_VIEW, EVALUATION_STATUS } from '../../../../modules/user/evaluations';
const { SUBJECT, MENTOR, ADMIN } = EVALUATION_VIEW;
const { NEW, SELF_EVALUATION_COMPLETE } = EVALUATION_STATUS;
import { actionCreators as uiActionCreators } from '../../../../modules/user/evaluation';
import { actions as entityActions } from '../../../../modules/user/evaluations';

import EvaluationHeader from './EvaluationHeader';
import Matrix from '../../../common/matrix/Matrix';
import Skill from './Skill';

class Evaluation extends React.Component {
  constructor(props) {
    super(props);

    this.nextSkill = this.nextSkill.bind(this);
    this.prevSkill = this.prevSkill.bind(this);
    this.nextCategory = this.nextCategory.bind(this);
    this.previousCategory = this.previousCategory.bind(this);
    this.evaluationComplete = this.evaluationComplete.bind(this);
    this.postUpdateNavigation = this.postUpdateNavigation.bind(this);
  }

  componentDidMount() {
    const { evaluationId, uiActions, initialisedEvaluation } = this.props;

    if (!initialisedEvaluation || initialisedEvaluation !== evaluationId) {
      uiActions.initEvaluation(evaluationId);
    }
  }

  nextSkill() {
    const { uiActions } = this.props;
    uiActions.nextSkill();
  }

  prevSkill() {
    const { uiActions } = this.props;
    uiActions.prevSkill();
  }

  nextCategory() {
    const { uiActions, evaluationId } = this.props;
    uiActions.nextCategory(evaluationId);
  }

  previousCategory() {
    const { uiActions, evaluationId } = this.props;
    uiActions.previousCategory(evaluationId);
  }

  evaluationComplete() {
    const { entityActions, evaluationId } = this.props;
    entityActions.evaluationComplete(evaluationId);
  }

  postUpdateNavigation() {
    const { uiActions, evaluationId } = this.props;
    uiActions.nextUnevaluatedSkill(evaluationId);
  }

  render() {
    const {
      skills,
      levels,
      skillGroups,
      view,
      status,
      initialisedEvaluation,
      updateSkillStatus,
      currentSkill,
      currentSkillId,
      currentSkillStatus,
      lastSkill,
      firstSkill,
      evaluationId,
      lastCategory,
      firstCategory,
      erringSkills,
    } = this.props;


    if (!initialisedEvaluation || initialisedEvaluation !== evaluationId) {
      return false;
    }

    return (
      <Grid>
        { erringSkills
          ? <Row>
              {erringSkills.map(
                ({ name }) =>
                  <Alert bsStyle='danger' key={name}>
                    {`There was a problem updating a skill: ${name}`}
                  </Alert>
              )}
            </Row>
          : false
        }
        <Row>
          <EvaluationHeader
            evaluationId={evaluationId}
            currentCategory={currentSkill.category}
            isFirstCategory={currentSkill.category === firstCategory}
            isLastCategory={currentSkill.category === lastCategory}
            nextCategory={this.nextCategory}
            previousCategory={this.previousCategory}
            evaluationComplete={this.evaluationComplete}
          />
        </Row>
        <Row>
          <Col md={7} className='evaluation-panel'>
            <Skill
              level={currentSkill.level}
              skill={currentSkill}
              skillStatus={currentSkillStatus}
              updateSkillStatus={updateSkillStatus}
              nextSkill={this.nextSkill}
              prevSkill={this.prevSkill}
              isFirstSkill={currentSkillId === firstSkill.skillId}
              isLastSkill={currentSkillId === lastSkill.skillId}
              postUpdateNavigation={this.postUpdateNavigation}
            />
          </Col>
          <Col md={5} className='evaluation-panel evaluation-panel--right'>
            <Matrix
              skillBeingEvaluated={currentSkillId}
              categories={[].concat(currentSkill.category)}
              levels={R.slice(levels.indexOf(currentSkill.level), Infinity, levels)}
              skillGroups={skillGroups}
              updateSkillStatus={updateSkillStatus}
              canUpdateSkillStatus={
                view === ADMIN
                || view === SUBJECT && status === NEW
                || view === MENTOR && status === SELF_EVALUATION_COMPLETE
              }
              skills={skills}
            />
          </Col>
        </Row>
      </Grid>
    )
  }
}

const skillShape = PropTypes.shape({
  skillId: PropTypes.number.isRequired,
  skillGroupId: PropTypes.number.isRequired,
  level: PropTypes.string.isRequried,
  category: PropTypes.string.isRequired ,
});

Evaluation.propTypes = {
  evaluationId: PropTypes.string.isRequired,
  view: PropTypes.string.isRequired,
  levels: PropTypes.array.isRequired,
  skills: PropTypes.object.isRequired,
  skillGroups: PropTypes.object.isRequired,
  status: PropTypes.string.isRequired,
  updateSkillStatus: PropTypes.func.isRequired,
  initialisedEvaluation: PropTypes.string,
  currentSkill: skillShape,
  currentSkillId: PropTypes.number,
  currentSkillStatus: PropTypes.shape({
    current: PropTypes.string,
    previous: PropTypes.string,
  }),
  firstCategory: PropTypes.string,
  lastCategory: PropTypes.string,
  firstSkill: skillShape,
  lastSkill: skillShape,
  erringSkills: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
  })),
};

export default connect(
  function mapStateToProps(state, props) {
    const { evaluationId } = props;
    const currentSkill = selectors.getCurrentSkill(state);
    const currentSkillId =  selectors.getCurrentSkillId(state);

    return ({
      initialisedEvaluation: selectors.getCurrentEvaluation(state),
      currentSkill,
      currentSkillId,
      currentSkillStatus: selectors.getSkillStatus(state, currentSkillId, evaluationId),
      firstCategory: selectors.getFirstCategory(state),
      lastCategory: selectors.getLastCategory(state),
      firstSkill: selectors.getFirstSkill(state),
      lastSkill: selectors.getLastSkill(state),
      erringSkills: selectors.getErringSkills(state, evaluationId),
    })
  },
  function mapDispatchToProps(dispatch) {
    return {
      uiActions: bindActionCreators(uiActionCreators, dispatch),
      entityActions: bindActionCreators(entityActions, dispatch)
    };
  }
)(Evaluation);
