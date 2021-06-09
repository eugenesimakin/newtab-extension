import {
  signIn,
  fetchTaskLists,
  fetchTasks,
  fetchCompletedTasks,
  fetchOneTask,
  moveTaskToCompleted as doMoveTaskToCompleted,
  moveTaskToNotStarted as doMoveTaskToNotStarted,
  removeTask as doRemoveTask,
} from './api';

export const requestUserAuth = () => (dispatch, getState) => {
  dispatch({ type: 'user/requestAuth' })
  signIn().then(result => {
    dispatch(requestTodos());
  }).catch(error => {
    dispatch({ type: 'user/errorRequestAuth', error });
  })
}

export const requestTodos = () => async (dispatch) => {
  dispatch({ type: 'todos/request' });
  try {
    let lists = await fetchTaskLists();
    lists = lists.value;
    let defaultList = lists.pop();
    while (defaultList) {
      if (defaultList.wellknownListName === 'defaultList') {
        break;
      }
      defaultList = lists.pop();
    }
    if (!defaultList) {
      dispatch(errorRequestTodos("Couldn't find the default task list"));
    }
    dispatch({ type: 'todos/taskListReceived', taskList: defaultList });
    let tasks = await fetchTasks(defaultList.id);
    tasks = tasks.value;
    dispatch({ type: 'todos/tasksReceived', tasks });
  } catch (error) {
    dispatch(errorRequestTodos(error))
  }
}

const errorRequestTodos = (error) => ({
  type: 'todos/errorRequest',
  error,
})

export const moveTaskToCompleted = (taskId) => async (dispatch, getState) => {
  dispatch({ type: 'todos/task/requestCompleted', taskId });
  const taskListId = getState().taskList.id;
  try {
    await doMoveTaskToCompleted(taskListId, taskId);
    const todoTask = await fetchOneTask(taskListId, taskId);
    dispatch({ type: 'todos/task/requestCompletedDone', task: todoTask });
  } catch (error) {
    dispatch({ type: 'todos/task/errorRequestCompleted', taskId, error });
  }
}

export const moveTaskToNotStarted = (taskId) => async (dispatch, getState) => {
  dispatch({ type: 'todos/task/requestNotStarted' });
  const taskListId = getState().taskList.id;
  try {
    await doMoveTaskToNotStarted(taskListId, taskId);
    const todoTask = await fetchOneTask(taskListId, taskId);
    dispatch({ type: 'todos/task/requestNotStartedDone', task: todoTask });
  } catch (error) {
    dispatch({ type: 'todos/task/errorRequestNotStarted', taskId, error });
  }
}

export const removeAllCompletedTasks = () => async (dispatch, getState) => {
  dispatch({ type: 'todos/tasks/requestRemove' });
  const taskListId = getState().taskList.id;
  let tasks = await fetchCompletedTasks(taskListId);
  let taskIds = tasks.value.map(task => task.id);
  try {
    const taskListId = getState().taskList.id;
    let taskId = taskIds.pop();
    while (taskId) {
      await doRemoveTask(taskListId, taskId);
      dispatch({ type: 'todos/tasks/taskRemoved', taskId });
      taskId = taskIds.pop();
    }
    dispatch({ type: 'todos/tasks/requestRemoveDone' });
  } catch (error) {
    console.error(error);
    dispatch({ type: 'todos/tasks/errorRequestRemove' });
  }
}

export const reset = () => ({
  type: 'reset',
})