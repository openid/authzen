import { useAuth } from "oidc-react";
import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { Todos } from "./components/Todos";
import { AppProps, Todo, User, Config } from "./interfaces";
import { useTodoService, useUser } from "./todoService";
import Select from "react-select";

import "react-toastify/dist/ReactToastify.css";
import "todomvc-app-css/index.css";

const ErrorWithLink: React.FC = () => (
  <div>
    <p>
      Error: failed to connect. This happens when the local server isn't
      running.
    </p>
    <p>
      <a
        href="https://github.com/aserto-demo/todo-application#backends"
        target="_blank"
        rel="noreferrer"
      >
        Refer to the docs to download and start a server in the language of your
        choice.{" "}
      </a>
    </p>
  </div>
);

type PDP = {
  name: string;
};

type SpecVersion = {
  name: string;
};

export const App: React.FC<AppProps> = (props) => {
  const auth = useAuth();
  const {
    createTodo,
    listTodos,
    getConfig,
    pdp,
    specVersion,
    setPdp,
    setSpecVersion,
  } = useTodoService();
  const userEmail = props.user.email;
  const [todos, setTodos] = useState<Todo[] | void>([]);
  const [config, setConfig] = useState<Config>();
  const [pdps, setPdps] = useState<PDP[]>([]);
  const [specVersions, setSpecVersions] = useState<SpecVersion[]>([]);
  const [todoTitle, setTodoTitle] = useState<string>("");
  const [showCompleted, setShowCompleted] = useState<boolean>(true);
  const [showActive, setShowActive] = useState<boolean>(true);
  const user: User = useUser(props.user.sub);
  const [currentPdpOption, setCurrentPdpOption] = useState<PDP>({ name: pdp });
  const [currentSpecVersion, setCurrentSpecVersion] = useState<SpecVersion>({ name: specVersion });

  const errorHandler = (errorText: string, close?: number | false) => {
    const autoClose = close === undefined ? 3000 : close;
    const msg = close === false ? ErrorWithLink : "Error: " + errorText;
    toast.error(msg, {
      position: "top-center",
      autoClose,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const onTodoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTodoTitle(e.target.value);
  };

  const handleSubmit: () => void = async () => {
    if (userEmail === "" || typeof userEmail === "undefined") {
      errorHandler("No user email found.");
      return;
    }

    if (todoTitle === "") {
      errorHandler("No Todo item entered.");
      return;
    }

    try {
      await createTodo({
        Title: todoTitle,
        Completed: false,
      });
    } catch (e) {
      if (e instanceof TypeError && e.message === "Failed to fetch") {
        errorHandler("", false);
      } else e instanceof Error && errorHandler(e.message);
      return;
    }
    setTodoTitle("");
    refreshTodos();
  };

  const refreshTodos: () => void = () => {
    const getTodos = async () => {
      try {
        const todos: Todo[] = await listTodos();
        setTodos(todos);
      } catch (e) {
        if (e instanceof TypeError && e.message === "Failed to fetch") {
          errorHandler("", false);
        } else e instanceof Error && errorHandler(e.message);
      }
    };

    getTodos();
  };

  const enableShowCompleted: () => void = () => {
    setShowCompleted(true);
    setShowActive(false);
  };

  const enableShowActive: () => void = () => {
    setShowActive(true);
    setShowCompleted(false);
  };

  const getSpecVersionsAndPdps: () => void = useCallback(async () => {
    const list = async () => {
      try {
        const config: Config = await getConfig();
        setConfig(config);
        const defaultSpecVersion = localStorage.getItem("specVersion") ?? Object.keys(config)[0];
        setSpecVersions(
          Object.keys(config).map((v) => {
            return { name: v };
          })
        );
        if (!specVersion) {
          setSpecVersion(defaultSpecVersion);
          setCurrentSpecVersion({ name: defaultSpecVersion });
        }
        const pdps = config[defaultSpecVersion];
        const defaultPdp = localStorage.getItem("pdp") ?? pdps[0];
        setPdps(
          pdps.map((pdp) => {
            return { name: pdp };
          })
        );
        if (!pdp) {
          setPdp(defaultPdp);
          setCurrentPdpOption({ name: defaultPdp });
        }
      } catch (e) {
        if (e instanceof TypeError && e.message === "Failed to fetch") {
          errorHandler("", false);
        } else e instanceof Error && errorHandler(e.message);
      }
    };

    list();
  }, [getConfig, pdp, specVersion, setPdp, setPdps, setSpecVersion, setSpecVersions]);

  const storePdp: (pdp: string) => void = useCallback(
    (pdp: string) => {
      setPdp(pdp);
      setCurrentPdpOption({ name: pdp });
      localStorage.setItem("pdp", pdp);
    },
    [setPdp]
  );

  const storeSpecVersion: (version: string) => void = useCallback(
    (version: string) => {
      setSpecVersion(version);
      setCurrentSpecVersion({ name: version });
      localStorage.setItem("specVersion", version);
      const pdps = config && config[version];
      if (pdps) {
        setPdps(
          pdps.map((pdp) => {
            return { name: pdp };
          })
        );
        storePdp(pdps[0]);
      }
    },
    [config, setSpecVersion, setPdps, storePdp]
  );

  useEffect(() => {
    getSpecVersionsAndPdps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (specVersion && pdp) {
      refreshTodos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specVersion, pdp])

  return (
    <div className="App">
      <section className="todoapp">
        <header className="header">
          <h1>todos</h1>
          <input
            className="new-todo"
            placeholder="What needs to be done?"
            value={todoTitle}
            onChange={(e) => onTodoChange(e)}
            onKeyDown={(e) => {
              e.key === "Enter" && handleSubmit();
            }}
          />
        </header>

        <section className="main">
          <input id="toggle-all" className="toggle-all" type="checkbox" />
          <label>Mark all as complete</label>
          <ul className="todo-list">
            <Todos
              todos={todos}
              refreshTodos={refreshTodos}
              showActive={showActive}
              showCompleted={showCompleted}
              errorHandler={errorHandler}
            />
          </ul>
        </section>
        <footer className="footer">
          <span className="todo-count">
            <strong>
              {todos?.filter((todo) => !todo.Completed).length ?? 0}
            </strong>{" "}
            item left
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
            <div className="pdp-info">
              <span className="select-title">AuthZEN version: &nbsp;</span>
              {pdps.length && (
                <Select
                  className="pdp-select"
                  isSearchable={false}
                  options={specVersions}
                  value={currentSpecVersion}
                  getOptionLabel={(version: SpecVersion) => version.name}
                  getOptionValue={(version: SpecVersion) => version.name}
                  onChange={(option) => storeSpecVersion(option!.name)}
                />
              )}
            </div>
            <div className="pdp-info">
              <span className="select-title">Authorize using: &nbsp;</span>
              {pdps.length && (
                <Select
                  className="pdp-select"
                  isSearchable={false}
                  options={pdps}
                  value={currentPdpOption}
                  getOptionLabel={(pdp: PDP) => pdp.name}
                  getOptionValue={(pdp: PDP) => pdp.name}
                  onChange={(option) => storePdp(option!.name)}
                />
              )}
            </div>
            <div className="user-info">
              <span className="user-name">
                Logged in as: <b>{props.user?.email}</b>
              </span>
              {user?.picture ? (
                <span className="user-picture">
                  <img
                    alt="user"
                    style={{
                      borderRadius: "50%",
                      width: 50,
                      height: 50,
                    }}
                    src={user.picture}
                  />
                </span>
              ) : null}
            </div>
            <div className="separator"></div>
            <div className="auth-button">
              <div onClick={() => auth.signOut()}>Log Out</div>
            </div>
          </>
        </div>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </footer>
    </div>
  );
};
