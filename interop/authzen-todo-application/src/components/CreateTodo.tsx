import { useState } from "react";
import { useTodos } from "../hooks/useTodos";

export function CreateTodoForm() {
  const { createTodo, isLoading } = useTodos();

  const [todoTitle, setTodoTitle] = useState("");

  const handleTodoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTodoTitle(e.target.value);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <input
        className="new-todo"
        placeholder="What needs to be done?"
        value={todoTitle}
        onChange={handleTodoChange}
        onKeyDown={(e) =>
          e.key === "Enter" &&
          createTodo({
            Title: todoTitle,
            Completed: false,
          }).then(() => {
            setTodoTitle("");
          })
        }
      />
      <div
        style={{
          marginRight: "6px",
          visibility: isLoading ? "visible" : "hidden",
        }}
      >
        <span className="loader"></span>
      </div>
    </div>
  );
}
