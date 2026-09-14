"use client";

import { useEffect, useState } from "react";

interface TodoType {
  id: number;
  todo: string;
  status: boolean;
}

export default function TodoList() {
  const [todo, setTodo] = useState<string>("");
  const [todoList, setTodoList] = useState<TodoType[]>(() => {
    if (typeof window === "undefined") return [];
    const getStoredData = localStorage.getItem("todoList");
    return getStoredData ? (JSON.parse(getStoredData) as TodoType[]) : [];
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);

  const handleAddTodo = () => {
    if (!todo) return alert("Please add a todo");

    if (isEditing && editId !== null) {
      setTodoList((prev) => prev.map((item) => (item.id === editId ? { ...item, todo } : item)));
      setIsEditing(false);
      setEditId(null);
    } else {
      const addTodo = {
        id: Date.now(),
        todo,
        status: false,
      };

      setTodoList((prev) => [addTodo, ...prev]);
    }
    setTodo("");
  };

  const handelDelete = (id: number) => {
    const filterOutId = todoList.filter((todos) => todos.id !== id);
    setTodoList(filterOutId);
  };

  const handelUpdateStatus = (id: number) => {
    setTodoList((prev) => prev.map((item) => (item.id === id ? { ...item, status: !item.status } : item)));
  };

  const handelEdit = (id: number) => {
    setIsEditing(true);
    const getData = todoList.find((todos) => todos.id === id);
    if (!getData) return;

    setEditId(id);
    setTodo(getData.todo);
  };

  useEffect(() => {
    localStorage.setItem("todoList", JSON.stringify(todoList));
  }, [todoList]);

  return (
    <>
      <div className="flex gap-4">
        <input
          type="text"
          className="outline"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddTodo();
          }}
          autoFocus
          value={todo}
          onChange={(e) => setTodo(e.target.value)}
        />
        <button onClick={handleAddTodo}>{isEditing ? "Update" : "Add"}</button>
      </div>

      <ul className="flex flex-col gap-4 ">
        {todoList.map(({ id, todo, status }) => (
          <li key={id} className="flex gap-10">
            <span className={`${status ? "line-through" : ""}`}>{todo}</span>
            <span className="px-5">
              <button className="p-2 outline" onClick={() => handelEdit(id)}>
                Edit
              </button>
              <button className="p-2 outline" onClick={() => handelUpdateStatus(id)}>
                {status ? "Mark InComplete" : "Mark Completed"}
              </button>
              <button className="p-2 outline" onClick={() => handelDelete(id)}>
                Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
