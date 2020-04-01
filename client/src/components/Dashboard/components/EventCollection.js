import React from "react";
import PropTypes from "prop-types";
import { ClipLoader } from "react-spinners";
import BootstrapTable from "react-bootstrap-table-next";
import cellEditFactory, { Type } from "react-bootstrap-table2-editor";
import Swal from "sweetalert2";
import request from "superagent";

import Button from "../../Button";

const EventCollection = (props) => {
  const { properties, projectId, eventCollection } = props;
  const [data, updateData] = React.useState(properties);
  let table = null;
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
        const promises = [];
        data.forEach((column) => {
          if (column.isUnsaved) {
            promises.push(request.put(`/api/projects/${projectId}/queries/addColumn`).send({
              event_collection: eventCollection,
              name: column.column_name,
              type: column.type,
            }));
          }
        });
        return Promise.all(promises).then(infos => infos).catch(error => Swal.showValidationMessage(`Request failed: ${error}`));
      },
      allowOutsideClick: () => !Swal.isLoading(),
    }).then((result) => {
      if (result.value.some(el => el.body)) return;
      updateData(data.map(el => ({ column_name: el.column_name, type: el.type })));
      Swal.fire({
        title: "Changes have been saved!!",
        text: "Refresh the page to view the updated table(s).",
        type: "success",
        confirmButtonText: "Nice!",
      });
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
        const promises = [];
        table.selectionContext.selected.forEach((columnToDrop) => {
          promises.push(request.delete(`/api/projects/${projectId}/queries/dropColumn`).send({ event_collection: eventCollection, columnToDrop }));
        });
        return Promise.all(promises).then(infos => infos).catch(error => Swal.showValidationMessage(`Request failed: ${error}`));
      },
      allowOutsideClick: () => !Swal.isLoading(),
    }).then((result) => {
      if (result.value.every(el => el.ok)) {
        updateData(data.filter(el => !table.selectionContext.selected.includes(el.column_name)));
        Swal.fire({
          title: "Poof!",
          text: "Your column(s) have been deleted! Refresh the page to view the updated table(s)!",
          type: "success",
          confirmButtonText: "Nice!",
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire("Cancelled", "Your column(s) are safe :)", "error");
      }
    });
  };
  const rowStyle = row => (row.isUnsaved ? ({ backgroundColor: "lightgrey" }) : {});
  const handleOnSelect = (row, isSelect) => !(isSelect && (["cenote", "uuid"].some(el => row.column_name.startsWith(el)) || row.isUnsaved));
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
      dataField: "column_name",
      text: "Property Name",
      align: "center",
      headerAlign: "center",
      classes: (_, row) => (row.column_name.startsWith("cenote") || row.column_name.startsWith("uuid") ? "has-text-danger" : "has-text-info"),
      editable: (_, row) => row.isUnsaved,
      editorStyle: { backgroundColor: "white" },
      sort: true,
    },
    {
      dataField: "type",
      text: "Property Type",
      align: "center",
      headerAlign: "center",
      classes: (_, row) => (row.column_name.startsWith("cenote") || row.column_name.startsWith("uuid") ? "has-text-danger" : "has-text-info"),
      editable: (_, row) => row.isUnsaved,
      editor: {
        type: Type.SELECT,
        options: [
          { value: "DECIMAL", label: "DECIMAL" },
          { value: "STRING", label: "STRING" },
          { value: "BOOL", label: "BOOL" },
          { value: "TIMESTAMP", label: "TIMESTAMP" },
        ],
      },
      sort: true,
    }];
  return (
    <div className="container is-fluid" style={{ display: "block", overflowX: "auto", whiteSpace: "nowrap" }}>
      {
      Object.keys(data).length
        ? (
          <div>
            <BootstrapTable
              ref={r => table = r}
              keyField="column_name"
              classes="table"
              data={data}
              columns={columns}
              selectRow={selectRow}
              wrapperClasses="container is-fluid"
              cellEdit={cellEditFactory({ mode: "click", blurToSave: true })}
              rowStyle={rowStyle}
            />
            <div className="is-grouped" role="group">
              <Button onClick={() => updateData(data.concat({ column_name: "New name...", type: "STRING", isUnsaved: true }))} label="+" />
              <Button onClick={handleSave} label="Save" type="success" />
              <Button onClick={handleDelete} label="Delete" type="danger" />
            </div>
          </div>
        ) : (<ClipLoader color="#008B8B" />)
    }
    </div>

  );
};

EventCollection.propTypes = {
  properties: PropTypes.array.isRequired,
  projectId: PropTypes.string.isRequired,
  eventCollection: PropTypes.string.isRequired,
};

export default EventCollection;
