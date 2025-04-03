import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";

/**
 * Sidebar component to  navigation links
 * has links to create tasks, view task status, and access analytics
 * The sidebar can be opened or closed
 *
 * @component
 * @example
 * <Sidebar mode="dark" />
 */
const Sidebar = ({ mode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const themeClass = mode === "dark" ? "sidebar-dark" : "sidebar-light";

  return (
    <div className={`sidebar ${themeClass} ${isCollapsed ? "collapsed" : ""}`}>
      <div className="menu">
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="hamburger-btn">
          ☰
        </button>
        <Link to="/">Create Task</Link>
        <Link to="/status">Task Status</Link>
        <Link to="/analytics">Analytics</Link>
      </div>
    </div>
  );
};

export default Sidebar;
