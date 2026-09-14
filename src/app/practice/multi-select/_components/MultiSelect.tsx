"use client";

import { useState, useMemo, useRef, useEffect } from "react";

const users = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
  { id: 3, name: "Alex Johnson" },
  { id: 4, name: "Emily Davis" },
  { id: 5, name: "Michael Brown" },
];

type User = (typeof users)[number];

export default function App() {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchUser, setSearchUser] = useState("");
  const [openDropdown, setOpenDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (dropdownRef.current && target && !dropdownRef.current.contains(target)) {
        setOpenDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => user.name.toLowerCase().includes(searchUser.toLowerCase()));
  }, [searchUser]);

  const toggleUser = (user: User) => {
    const isSelected = selectedUsers.some((selectedUser) => selectedUser.id === user.id);

    if (isSelected) {
      setSelectedUsers((prev) => prev.filter((selectedUser) => selectedUser.id !== user.id));
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  const removeUser = (userId: number) => {
    setSelectedUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpenDropdown(false);
    }
  };

  return (
    <div
      ref={dropdownRef}
      style={{
        width: "300px",
        margin: "40px auto",
        position: "relative",
      }}
    >
      {/* Selected Chips */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        {selectedUsers.map((user) => (
          <div
            key={user.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 8px",
              border: "1px solid #ccc",
              borderRadius: "16px",
            }}
          >
            {user.name}
            <button onClick={() => removeUser(user.id)}>×</button>
          </div>
        ))}
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search user..."
        value={searchUser}
        onFocus={() => setOpenDropdown(true)}
        onChange={(e) => setSearchUser(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          width: "100%",
          padding: "10px",
          boxSizing: "border-box",
        }}
      />

      {/* Dropdown */}
      {openDropdown && (
        <ul
          className="border border-border bg-surface-elevated"
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            maxHeight: "200px",
            overflowY: "auto",
            position: "absolute",
            width: "100%",
            zIndex: 10,
          }}
        >
          {filteredUsers.length === 0 ? (
            <li
              style={{
                padding: "10px",
              }}
            >
              No users found
            </li>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selectedUsers.some((selectedUser) => selectedUser.id === user.id);

              return (
                <li
                  key={user.id}
                  onClick={() => toggleUser(user)}
                  style={{
                    padding: "10px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{user.name}</span>

                  {isSelected && <span>✔</span>}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
