import { useQuery, useMutation } from "@tanstack/react-query";
import { createTodoApi } from "../api/todoApi";
import { Todo, TodoValues } from "../interfaces";

import { useConfig } from "../context/ConfigContext";
import { errorHandler } from "../utils/errorHandler";
import { queryClient } from "../utils/queryClient";

export const useTodos = () => {
  const { headers, gateways, gateway } = useConfig();
  const url = gateways[gateway ?? Object.keys(gateways)[0]];
  const api = createTodoApi(url, headers);

  const { data: todos = [], isFetching } = useQuery({
    queryKey: ["todos"],
    queryFn: () => api.listTodos(),
  });

  const createTodoMutation = useMutation({
    mutationFn: (newTodo: TodoValues) => api.createTodo(newTodo),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["todos"] });
    },
    onError: (error) => {
      errorHandler(error.message);
    },
  });

  const updateTodoMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: TodoValues }) =>
      api.updateTodo(id, values),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["todos"] });
    },
    onError: (error) => {
      errorHandler(error.message);
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: (todo: Todo) => api.deleteTodo(todo),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["todos"] });
    },
    onError: (error) => {
      errorHandler(error.message);
    },
  });

  return {
    todos,
    remainingTodos: todos.filter((todo) => !todo.Completed).length,
    isLoading:
      isFetching ||
      createTodoMutation.isPending ||
      updateTodoMutation.isPending ||
      deleteTodoMutation.isPending,
    createTodo: createTodoMutation.mutateAsync,
    updateTodo: updateTodoMutation.mutateAsync,
    deleteTodo: deleteTodoMutation.mutateAsync,
  };
};
