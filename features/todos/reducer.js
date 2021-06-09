const initialState = {
  auth: 'none',
  taskList: null,
  tasks: [],
  isLoadingTodos: false,
  error: null,
}

// task.status = notStarted | inProgress | completed | waitingOnOthers | deferred

const reducer = (state = initialState, action) => {
  let status = null;
  switch (action.type) {
    case 'todos/request':
      return {
        ...state,
        auth: 'ok',
        isLoadingTodos: true,
      }
    case 'todos/errorRequest':
      return {
        ...state,
        isLoadingTodos: false,
        error: action.error,
      }
    case 'todos/taskListReceived':
      return {
        ...state,
        taskList: action.taskList,
      }
    case 'todos/tasksReceived': {
      let tasks = action.tasks
        .filter(task => task.id)
        .filter(task => task.status !== 'completed')
        .map(task => ({
          ...task,
          order: calcTaskOrder(task),
        }))
      tasks = tasks.sort((a, b) => a.order - b.order);
      tasks = tasks.map(task => {
        delete task.order;
        return task;
      })
      let completedTasks = action.tasks.filter(task => task.status === 'completed');
      if (completedTasks.length > 0) {
        let groupedCompletedTask = {
          id: GROUPED_COMPLETED_ID,
          title: groupedCompletedTitle(completedTasks.length),
          status: 'completed',
          len: completedTasks.length,
        }
        tasks.push(groupedCompletedTask);
      }
      return {
        ...state,
        isLoadingTodos: false,
        tasks
      }
    }
    case 'user/requestAuth':
      return {
        ...state,
        auth: 'in-progress',
      }
    case 'user/errorRequestAuth':
      return {
        ...state,
        error: action.error,
        auth: 'none',
      }
    case 'todos/task/requestCompleted':
      status = 'moving-to-completed';
    case 'todos/task/requestNotStarted':
      if (!status) status = 'moving-to-notstarted';
      return {
        ...state,
        tasks: state.tasks.map(task => {
          if (task.id === action.taskId) {
            task.status = status;
          }
          return task;
        })
      }
    case 'todos/task/requestCompletedDone':
    case 'todos/task/requestNotStartedDone':
      return {
        ...state,
        tasks: state.tasks.map(task => {
          if (task.id === action.task.id) {
            return action.task;
          }
          return task;
        })
      }
    case 'todos/task/errorRequestCompleted':
      status = 'completed';
    case 'todos/task/errorRequestNotStarted':
      if (!status) status = 'notStarted';
      return {
        ...state,
        tasks: state.tasks.map(task => {
          if (task.id === action.taskId) {
            task.status = status; // reset the status back
          }
          return task;
        })
      }
    case 'todos/tasks/requestRemove':
      return {
        ...state,
        tasks: state.tasks.map(task => {
          if (task.id === GROUPED_COMPLETED_ID) {
            task.status = 'removing';
          }
          return task;
        })
      }
    case 'todos/tasks/taskRemoved':
      return {
        ...state,
        tasks: state.tasks.map(task => {
          if (task.id === GROUPED_COMPLETED_ID) {
            task.len = (task.len - 1);
            task.title = groupedCompletedTitle(task.len);
          }
          return task;
        })
      }
    case 'todos/tasks/requestRemoveDone':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== GROUPED_COMPLETED_ID),
      }
    case 'todos/tasks/errorRequestRemove':
      return {
        ...state,
        tasks: state.tasks.map(task => {
          if (task.id === GROUPED_COMPLETED_ID) {
            task.status = 'completed';
          }
          return task;
        })
      }
    case 'reset':
      return initialState;
    default:
      return state;
  }
}

const calcTaskOrder = (task) => {
  if (task.status === 'completed') {
    return 20;
  } else if (task.importance === 'high') {
    return 0;
  } else {
    return 10;
  }
}

export const GROUPED_COMPLETED_ID = 'grouped-completed';

const groupedCompletedTitle = (num) => `and ${num} more task(s) completed`;

export default reducer;