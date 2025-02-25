import { Todo as TodoItem } from "./Todo";
import { TodosProps } from "../interfaces";
import { useTodos } from "../hooks/useTodos";

export const Todos = (props: TodosProps) => {
  const { todos, updateTodo, deleteTodo } = useTodos();

  return (
    <>
      {props.showCompleted &&
        todos
          ?.filter((todo) => todo.Completed)
          .map((todo) => {
            return (
              <TodoItem
                todo={todo}
                handleCompletedChange={() =>
                  updateTodo({
                    id: todo.ID,
                    values: { ...todo, Completed: !todo.Completed },
                  })
                }
                handleDeleteChange={() => deleteTodo(todo)}
                key={todo.ID}
              />
            );
          })}
      {props.showActive &&
        todos
          ?.filter((todo) => !todo.Completed)
          .map((todo) => {
            return (
              <TodoItem
                todo={todo}
                handleCompletedChange={() =>
                  updateTodo({
                    id: todo.ID,
                    values: { ...todo, Completed: !todo.Completed },
                  })
                }
                handleDeleteChange={() => deleteTodo(todo)}
                key={todo.ID}
              />
            );
          })}
    </>
  );
};
