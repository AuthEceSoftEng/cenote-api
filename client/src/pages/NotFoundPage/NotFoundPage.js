import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <div className="lost-page section">
    <div className="container">
      <h1 className="title is-1">404 Page Not Found</h1>
      <Link to="/"> Go back to homepage </Link>
    </div>
  </div>
);

export default NotFoundPage;
