import React from "react";
import PropTypes from "prop-types";
import BootstrapTable from "react-bootstrap-table-next";
import cellEditFactory from "react-bootstrap-table2-editor";
import Swal from "sweetalert2";
import request from "superagent";
import { push } from "connected-react-router";
import * as localForage from "localforage";

import Button from "../../Button";

const Collaborators = (props) => {
  let table = null;
  const { projectId, collaborators, setCollaborators } = props;
  if (!collaborators) {
    return localForage.removeItem("persist:root").then(() => push("/"));
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [data, updateData] = React.useState(collaborators.map(el => ({ collaboratorName: el })));
  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    request.get(`/api/projects/${projectId}/collaborators`).then(result => updateData(JSON.parse(result.text).collaborators
      .map(el => ({ collaboratorName: el.username, isUnsaved: false }))));
  }, [projectId]);
  const handleSave = () => {
    if (!data.some(el => el.isUnsaved)) return;
    Swal.fire({
      title: "Are you sure?",
      type: "info",
      showCancelButton: true,
      confirmButtonText: "Yes!",
      cancelButtonText: "No, cancel!",
      showLoaderOnConfirm: true,
      preConfirm: () => {
        Swal.showLoading();
        const updatedData = data;
        const promise = request.put(`/api/projects/${projectId}/collaborator`).send({ username: updatedData.map(el => el.collaboratorName) });
        return promise.then(infos => infos).catch(error => Swal.showValidationMessage(`Request failed: ${error}`));
      },
      allowOutsideClick: () => !Swal.isLoading(),
    }).then((result) => {
      if (result.value) {
        updateData(data.map(el => ({ ...el, isUnsaved: false })));
        setCollaborators(data);
        Swal.fire({
          title: "Changes have been saved!!",
          text: "The page will refresh to the updated table(s).",
          type: "success",
          confirmButtonText: "Nice!",
          onAfterClose: () => window.location.reload(),
        });
      }
    });
  };
  const handleDelete = () => {
    if (!(table && table.selectionContext.selected.length)) return;
    Swal.fire({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover data lost!",
      type: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!",
      showLoaderOnConfirm: true,
      preConfirm: () => {
        const updatedData = data.filter(el => !table.selectionContext.selected.includes(el.collaboratorName));
        const promise = request.put(`/api/projects/${projectId}/collaborator`).send({ username: updatedData.map(el => el.collaboratorName) });
        return promise.then(infos => infos).catch(error => Swal.showValidationMessage(`Request failed: ${error}`));
      },
      allowOutsideClick: () => !Swal.isLoading(),
    }).then((result) => {
      if (result.value) {
        updateData(data.filter(el => !table.selectionContext.selected.includes(el.collaboratorName)));
        setCollaborators(data);
        Swal.fire({
          title: "Poof!",
          text: "Collaborator(s) have been deleted! The page will refresh to the updated table(s)!",
          type: "success",
          confirmButtonText: "Nice!",
          onAfterClose: () => window.location.reload(),
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire("Cancelled", "Your collaborator(s) are safe :)", "error");
      }
    });
  };
  const rowStyle = row => (row.isUnsaved ? ({ backgroundColor: "lightgrey" }) : {});
  const handleOnSelect = row => !row.isUnsaved;
  const selectRow = {
    mode: "checkbox",
    hideSelectAll: true,
    style: { backgroundColor: "#c8e6c9" },
    onSelect: handleOnSelect,
    clickToSelect: true,
    clickToEdit: true,
  };
  const columns = [
    {
      dataField: "collaboratorName",
      text: "Collaborator",
      align: "center",
      headerAlign: "center",
      classes: "has-text-info",
      editable: (_, row) => row.isUnsaved,
      editorStyle: { backgroundColor: "white" },
      sort: true,
    }];
  return (
    <div className="container is-fluid" style={{ display: "block", overflowX: "auto", whiteSpace: "nowrap" }}>
      <div>
        <BootstrapTable
          ref={r => table = r}
          keyField="collaboratorName"
          classes="table"
          data={data}
          columns={columns}
          selectRow={selectRow}
          wrapperClasses="container is-fluid"
          cellEdit={cellEditFactory({ mode: "click", blurToSave: true })}
          rowStyle={rowStyle}
        />
        <div className="is-grouped" role="group">
          <Button onClick={() => updateData(data.concat({ collaboratorName: "New name...", isUnsaved: true }))} label="+" />
          <Button onClick={handleSave} label="Save" type="success" />
          <Button onClick={handleDelete} label="Delete" type="danger" />
        </div>
      </div>
    </div>

  );
};

Collaborators.propTypes = {
  projectId: PropTypes.string.isRequired,
  collaborators: PropTypes.array.isRequired,
  setCollaborators: PropTypes.func.isRequired,
};

export default Collaborators;
