"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface Task {
  _id: string;
  title: string;
  description?: string;
}

interface User {
  name: string;
  email: string;
}

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔐 Check Auth + Load Profile
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        setUser(res.data);
      } catch {
        localStorage.removeItem("token");
        router.push("/login");
      }
    };

    fetchProfile();
  }, [router]);

  // 📥 Fetch Tasks
  const fetchTasks = async (searchQuery = "") => {
    setLoading(true);
    try {
      const res = await api.get(`/tasks?search=${searchQuery}`);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // ➕ Create Task
  const handleCreateTask = async () => {
    if (!title.trim()) return;

    try {
      await api.post("/tasks", { title });
      setTitle("");
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // 🗑 Delete Task
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // ✏️ Update Task
  const handleUpdate = async (id: string) => {
    if (!editTitle.trim()) return;

    try {
      await api.put(`/tasks/${id}`, { title: editTitle });
      setEditingId(null);
      setEditTitle("");
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // 🔎 Search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    fetchTasks(value);
  };

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (!user) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* Create Task */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Create Task</h2>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 p-2 border rounded-lg"
          />
          <button
            onClick={handleCreateTask}
            className="bg-black text-white px-5 rounded-lg"
          >
            Add
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={handleSearch}
          className="w-full p-2 border rounded-lg"
        />
      </div>

      {/* Task List */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-lg font-semibold mb-4">Your Tasks</h2>

        {loading && <p className="mb-3">Loading tasks...</p>}
        {!loading && tasks.length === 0 && <p>No tasks found.</p>}

        <ul className="space-y-3">
          {tasks.map((task) => (
            <li
              key={task._id}
              className="flex justify-between items-center border p-3 rounded-lg"
            >
              {editingId === task._id ? (
                <div className="flex gap-2 w-full">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 p-1 border rounded"
                  />
                  <button
                    onClick={() => handleUpdate(task._id)}
                    className="bg-green-500 text-white px-3 rounded"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <span>{task.title}</span>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setEditingId(task._id);
                        setEditTitle(task.title);
                      }}
                      className="text-blue-500"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(task._id)}
                      className="text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
