import { useState } from "react";

import "react-toastify/dist/ReactToastify.css";
import "todomvc-app-css/index.css";
import { useAuth } from "./context/AuthContext";
import { Todos } from "./components/Todos";
import { useTodos } from "./hooks/useTodos";

import "./App.css";
import { CreateTodoForm } from "./components/CreateTodo";
import { UserCard } from "./components/UserCard";
import { AuthZENSettings } from "./components/AuthZENSettings";

export const App = () => {
  const auth = useAuth();
  const { remainingTodos } = useTodos();

  const [showCompleted, setShowCompleted] = useState(true);
  const [showActive, setShowActive] = useState(true);

  const enableShowCompleted: () => void = () => {
    setShowCompleted(true);
    setShowActive(false);
  };

  const enableShowActive: () => void = () => {
    setShowActive(true);
    setShowCompleted(false);
  };

  return (
    <div className="App">
      <section className="todoapp">
        <header className="header">
          <h1>todos</h1>
          <CreateTodoForm />
        </header>

        <section className="main">
          <input id="toggle-all" className="toggle-all" type="checkbox" />
          <label>Mark all as complete</label>
          <ul className="todo-list">
            <Todos showActive={showActive} showCompleted={showCompleted} />
          </ul>
        </section>
        <footer className="footer">
          <span className="todo-count">
            <strong>{remainingTodos}</strong> item left
          </span>
          <ul className="filters">
            <li>
              <a
                className={showCompleted && showActive ? "selected" : ""}
                onClick={() => {
                  setShowActive(true);
                  setShowCompleted(true);
                }}
                href="/#"
              >
                All
              </a>
            </li>
            <li>
              <a
                className={showActive && !showCompleted ? "selected" : ""}
                onClick={() => enableShowActive()}
                href="/#"
              >
                Active
              </a>
            </li>
            <li>
              <a
                className={showCompleted && !showActive ? "selected" : ""}
                onClick={() => enableShowCompleted()}
                href="/#"
              >
                Completed
              </a>
            </li>
          </ul>
        </footer>
      </section>
      <footer className="info">
        <div className="user-controls">
          <>
            <AuthZENSettings />
            <UserCard />
            <div className="separator"></div>
            <div className="auth-button">
              <div onClick={() => auth.signOut()}>Log Out</div>
            </div>
          </>
        </div>
      </footer>
    </div>
  );
};
