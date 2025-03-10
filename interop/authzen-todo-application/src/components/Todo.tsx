import { TodoProps } from "../interfaces";
import { useUser } from "../hooks/useUser";

export const Todo = (todoProps: TodoProps) => {
  const { user } = useUser(todoProps.todo.OwnerID);

  return (
    <li className={todoProps.todo.Completed ? "completed" : ""}>
      <div className="view">
        <input
          className="toggle"
          disabled={!!todoProps.todo.CannotUpdate}
          type="checkbox"
          onChange={() =>
            todoProps.handleCompletedChange(
              todoProps.todo.ID,
              !todoProps.todo.Completed
            )
          }
          checked={todoProps.todo.Completed}
        />
        <label
          onClick={() =>
            todoProps.handleCompletedChange(
              todoProps.todo.ID,
              !todoProps.todo.Completed
            )
          }
        >
          {todoProps.todo.Title}
          {user?.picture ? (
            <img
              alt="user"
              style={{
                borderRadius: "50%",
                width: 30,
                height: 30,
                display: "block",
                float: "right",
                marginRight: 50,
              }}
              src={user.picture}
            />
          ) : null}
        </label>
        <button
          className="destroy"
          onClick={() => todoProps.handleDeleteChange(todoProps.todo)}
        ></button>
      </div>
    </li>
  );
};
