import { handleActions, createAction } from 'redux-actions';
import * as keymirror from 'keymirror';
import * as R from 'ramda';

import api from '../../api';

type TasksState = {
  tasks: TaskViewModel[],
  loading: boolean,
  error: null | { message: string },
  fetched: boolean,
};

export const actionTypes = keymirror({
  RETRIEVE_TASKS_SUCCESS: null,
  RETRIEVE_TASKS_FAILURE: null,
  LOADING_TASKS: null,
  RESET_TASKS: null,
});

const actions = {
  retrieveTasksSuccess: createAction(actionTypes.RETRIEVE_TASKS_SUCCESS, tasks => tasks),
  retrieveTasksFailure: createAction(actionTypes.RETRIEVE_TASKS_FAILURE, error => error),
  loadingTasks: createAction(actionTypes.LOADING_TASKS),
  resetTasks: createAction(actionTypes.RESET_TASKS),
};

function retrieveTasks(userId) {
  return (dispatch) => {
    dispatch(actions.loadingTasks());

    return api.retrieveTasks(userId)
      .then(tasks => dispatch(actions.retrieveTasksSuccess(tasks)))
      .catch(error => dispatch(actions.retrieveTasksFailure(error)));
  };
}

function resetTasks() {
  return actions.resetTasks();
}

export const actionCreators = {
  retrieveTasks,
  resetTasks,
};

export const initialState = {
  tasks: [],
  error: null,
  loading: false,
  fetched: false,
};

export default handleActions({
  [actions.retrieveTasksSuccess]: (state: TasksState, action) =>
    ({ tasks: action.payload, error: null, loading: false, fetched: true }),
  [actions.retrieveTasksFailure]: (state: TasksState, action) =>
    ({ ...initialState,  error: action.payload }),
  [actions.loadingTasks]: (state: TasksState) =>
    ({ ...initialState, loading: true }),
  [actions.resetTasks]: () => initialState,
}, initialState);

export const getTasks = (state: TasksState): TaskViewModel[] =>
  R.prop('tasks', state) || [];

export const getTaskCount = (state: TasksState) =>
  getTasks(state).length;

export const getTasksLoadingState = (state: TasksState): boolean =>
  R.prop('loading', state);

export const getFetchedState = (state: TasksState): boolean =>
  R.prop('fetched', state);

export const getTasksError = (state: TasksState): null | { message?: string } =>
  R.prop('error', state);
