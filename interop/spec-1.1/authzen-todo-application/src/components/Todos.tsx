import * as React from "react";
import { Todo as TodoItem } from "./Todo";
import { TodosPropsn } from "../interfaces";
import { useTodoService } from "../todoService";
import { toast } from "react-toastify";
export const Todos: React.FC<TodosPropsn> = (props) => {
  const { saveTodo, deleteTodos } = useTodoService();

  const [deleteList, setDeleteList] = React.useState<string[]>([]);

  const handleCompletedChange = async (todoId: string, completed: boolean) => {
    const todo = props.todos?.find((todo) => todo.ID === todoId);
    if (todo) {
      try {
        await saveTodo(todo.ID, { ...todo, Completed: completed });
      } catch (e) {
        e instanceof Error && props.errorHandler(e.message);
      }
    } else {
      props.errorHandler("Todo not found");
    }

    props.refreshTodos();
  };

  return (
    <div>
      {props.showCompleted &&
        props.todos
          ?.filter((todo) => todo.Completed)
          .map((todo) => {
            return (
              <TodoItem
                todo={todo}
                selectedForDelete={deleteList.includes(todo.ID)}
                handleCompletedChange={handleCompletedChange}
                handleDeleteCheck={(markedForDeletion: boolean) => {
                  if (markedForDeletion) {
                    setDeleteList([...deleteList, todo.ID]);
                  } else {
                    setDeleteList(deleteList.filter((id) => id !== todo.ID));
                  }
                }}
                key={todo.ID}
              />
            );
          })}
      {props.showActive &&
        props.todos
          ?.filter((todo) => !todo.Completed)
          .map((todo) => {
            return (
              <TodoItem
                todo={todo}
                selectedForDelete={deleteList.includes(todo.ID)}
                handleCompletedChange={handleCompletedChange}
                handleDeleteCheck={(markedForDeletion: boolean) => {
                  if (markedForDeletion) {
                    setDeleteList([...deleteList, todo.ID]);
                  } else {
                    setDeleteList(deleteList.filter((id) => id !== todo.ID));
                  }
                }}
                key={todo.ID}
              />
            );
          })}
      <button
        className="delete-button"
        disabled={deleteList.length === 0}
        onClick={async () => {
          try {
            const result = await deleteTodos(deleteList);

            Object.keys(result.result).forEach((key) => {
              if (result.result[key] === "DELETED") {
                toast.info(`Todo ${key} deleted`, {
                  position: "top-right",
                  autoClose: 5000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                });
              } else {
                toast.error(`Permission denied deleting todo ${key}`, {
                  position: "top-right",
                  autoClose: 5000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                });
              }
            });

            setDeleteList([]);
            props.refreshTodos();
          } catch (e) {}
        }}
      >
        Delete Todos
      </button>
    </div>
  );
};
