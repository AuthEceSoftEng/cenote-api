import React from "react";
import { connect } from "react-redux";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="content has-text-centered">
          <p>
            {`Copyright Ⓒ ${year} SoftEng Group, Intelligent Systems & Software Engineering Labgroup. All Rights Reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default connect()(Footer);
