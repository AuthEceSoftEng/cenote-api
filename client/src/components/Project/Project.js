import React from "react";
import PropTypes from "prop-types";
import { faFolderOpen } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt, faBan, faPencilAlt, faSave } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

export default function Project(props) {
  const {
    edit, title, currentTitle, createdMessage, openProjectInfo, updateTitle, updateProjectTitle,
    editProject, cancelEdit, deleteProject, owner, currentUser,
  } = props;

  const openModal = (ownr, curUser) => {
    if (ownr === curUser) {
      Swal.fire({
        title: "Are you sure?",
        text: "Once deleted, you will not be able to recover data lost!",
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, cancel!",
      }).then((result) => {
        if (result.value) {
          deleteProject();
          Swal.fire("Poof!", "Your project has been deleted!", "success");
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire("Cancelled", "Your project(s) are safe :)", "error");
        }
      });
    } else {
      Swal.fire("Cancelled", "You are not the owner of this project!", "error");
    }
  };

  return (
    <li
      className="project box"
      style={{
        borderRadius: "1rem",
        padding: "0",
        height: "10rem",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ backgroundColor: "#00A09E", color: "white", borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem" }}>
        <article className="media">
          <div className="media-content">
            <div className="content" style={{ padding: "0.2rem" }}>
              {edit ? (
                <form onSubmit={(evt) => {
                  updateProjectTitle();
                  evt.preventDefault();
                }}
                >
                  <input className="input" type="text" value={currentTitle} onChange={updateTitle} ref={inpt => inpt && inpt.focus()} />
                </form>
              ) : (
                <p style={{ marginBottom: "0", fontSize: "1.4rem", fontWeight: "bold" }}>
                  {`${title}${owner ? ` (${owner})` : ""}`}
                </p>
              )}
              <p>
                <small>{`created ${createdMessage}`}</small>
              </p>
            </div>
          </div>
        </article>
      </div>
      <div style={{ marginTop: "auto" }}>
        <nav className="level" style={{ paddingBottom: "0.4rem", paddingRight: "0.4rem" }}>
          <div className="level-left" />
          <div className="level-right">
            <span className="icon space-right" role="button" tabIndex={0} onClick={openProjectInfo} onKeyPress={openProjectInfo}>
              <FontAwesomeIcon icon={faFolderOpen} color="orange" size="lg" style={{ color: "#00A09E" }} />
            </span>
            {edit ? (
              <span
                className="icon
                space-right"
                role="button"
                tabIndex={0}
                onClick={updateProjectTitle}
                onKeyPress={updateProjectTitle}
              >
                <FontAwesomeIcon icon={faSave} size="lg" style={{ color: "#00A09E" }} />
              </span>
            ) : (owner === currentUser) && (
            <span className="icon space-right" role="button" tabIndex={0} onClick={editProject} onKeyPress={editProject}>
              <FontAwesomeIcon icon={faPencilAlt} size="lg" style={{ color: "#00A09E" }} />
            </span>
            )}
            {edit ? (
              <span className="icon" role="button" tabIndex={-1} onClick={cancelEdit} onKeyPress={cancelEdit}>
                <FontAwesomeIcon icon={faBan} size="lg" style={{ color: "#00A09E" }} />
              </span>
            ) : (owner === currentUser) && (
            <span
              className="icon"
              role="button"
              tabIndex={-1}
              onClick={() => openModal(owner, currentUser)}
              onKeyPress={() => openModal(owner, currentUser)}
            >
              <FontAwesomeIcon icon={faTrashAlt} size="lg" style={{ color: "#00A09E" }} />
            </span>
            )}
          </div>
        </nav>
      </div>
    </li>
  );
}

Project.propTypes = {
  edit: PropTypes.bool.isRequired,

  title: PropTypes.string.isRequired,
  owner: PropTypes.string.isRequired,
  currentUser: PropTypes.string.isRequired,
  currentTitle: PropTypes.string.isRequired,
  createdMessage: PropTypes.string.isRequired,

  openProjectInfo: PropTypes.func.isRequired,
  updateTitle: PropTypes.func.isRequired,
  updateProjectTitle: PropTypes.func.isRequired,
  editProject: PropTypes.func.isRequired,
  cancelEdit: PropTypes.func.isRequired,
  deleteProject: PropTypes.func.isRequired,
};
