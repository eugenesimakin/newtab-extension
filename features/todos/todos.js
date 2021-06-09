import { createStore, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'
import reducer, { GROUPED_COMPLETED_ID } from './reducer';
import {
  requestTodos,
  requestUserAuth,
  moveTaskToCompleted,
  moveTaskToNotStarted,
  removeAllCompletedTasks,
  reset,
} from './actions';
import { getAllAccounts } from './api';

const enhancer = applyMiddleware(thunkMiddleware);
const store = createStore(reducer, enhancer);

const rootElem = document.getElementById('todos');

store.subscribe(async () => {
  rootElem.innerHTML = '';

  const state = store.getState();

  if (state.error) {
    rootElem.innerHTML = `<p class="error">Error: ${state.error} <span class="close">&times;</span></p>`;
    rootElem.querySelector('span').onclick = function () {
      store.dispatch(reset());
    }
    return;
  }

  if (state.auth === 'none') {
    rootElem.innerHTML = `<p><a href="#">Sign In</a> to see your daily todos...</p>`;
    rootElem.querySelector('a').onclick = (event) => {
      event.preventDefault();
      store.dispatch(requestUserAuth());
    }
    return;
  } else if (state.auth === 'in-progress') {
    rootElem.innerHTML = `<p>Awaiting user authorization...</p>`;
  } else if (state.auth === 'ok') {
    if (state.isLoadingTodos) {
      rootElem.innerHTML = `<p>Loading todos...</p>`;
    } else {
      const todos = state.tasks;
      const ul = document.createElement('ul');
      todos.forEach(task => {
        let li = document.createElement('li');
        if (task.status === 'completed' && task.id === GROUPED_COMPLETED_ID) {
          li.innerHTML = `<span class="completed" title="${task.title}">${task.title}</span><i class="bi bi-trash-fill"></i>`;
          let i = li.querySelector('i');
          i.onclick = (event) => {
            event.stopPropagation();
            if (confirm('You are about to remove all completed tasks. Are you sure?')) {
              store.dispatch(removeAllCompletedTasks());
            }
          }
        } else if (task.status === 'completed') {
          li.innerHTML = `<span class="completed" title="${task.title}">${task.title}</span><i class="bi bi-check-square-fill"></i>`;
          let i = li.querySelector('i');
          i.onclick = (event) => {
            event.stopPropagation();
            store.dispatch(moveTaskToNotStarted(task.id));
          }
        } else if (task.status === 'moving-to-completed' || task.status === 'moving-to-notstarted') {
          li.innerHTML = `<span title="${task.title}">${task.title}</span><i class="bi bi-clock loading"></i>`;
        } else if (task.status === 'removing') {
          li.innerHTML = `<span title="${task.title}">${task.title}</span><i class="bi bi-clock loading"></i>`;
        } else {
          li.innerHTML = `<span title="${task.title}">${task.title}</span><i class="bi bi-square"></i>`;
          let i = li.querySelector('i');
          i.onmouseover = () => {
            i.classList.remove('bi-square');
            i.classList.add('bi-check-square');
          }
          i.onmouseleave = () => {
            i.classList.add('bi-square');
            i.classList.remove('bi-check-square');
          }
          i.onclick = (event) => {
            event.stopPropagation();
            store.dispatch(moveTaskToCompleted(task.id));
          }
          if (task.importance === 'high') {
            const importanceIcon = document.createElement('i');
            importanceIcon.classList.add('bi');
            importanceIcon.classList.add('bi-exclamation-circle');
            importanceIcon.classList.add('important-task');
            li.insertBefore(importanceIcon, li.firstChild);
          }
        }
        li.onclick = function () {
          window.location.assign(`https://to-do.live.com/tasks/id/${task.id}/details`);
        }
        ul.appendChild(li);
      })
      rootElem.appendChild(ul);
      rootElem.insertAdjacentHTML('beforeend', `<a class="msft-ref" href="https://to-do.live.com/tasks/">Edit on todo.microsoft.com</a>`);
    }
  } else {
    rootElem.innerHTML = `<p>Unknown error</p>`;
  }
})

const accounts = getAllAccounts();
if (accounts.length > 0) {
  store.dispatch(requestTodos());
} else {
  store.dispatch({ type: 'dummy' });
}
