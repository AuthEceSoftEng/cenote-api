import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactTable from "react-table";

export default class DraggableTable extends Component {
  static propTypes = { data: PropTypes.array.isRequired, columns: PropTypes.array.isRequired }

  constructor(props) {
    super(props);
    this.dragged = null;
    this.reorder = [];
    this.reactTable = null;
  }

  componentDidMount() {
    this.mountEvents();
  }

  componentDidUpdate() {
    this.mountEvents();
  }

  mountEvents() {
    const headers = Array.prototype.slice.call(document.querySelectorAll(".draggable-header"));

    headers.forEach((header, i) => {
      header.setAttribute("draggable", true);
      header.ondragstart = (e) => {
        e.stopPropagation();
        this.dragged = i;
      };

      header.ondrag = e => e.stopPropagation;

      header.ondragend = (e) => {
        e.stopPropagation();
        setTimeout(() => (this.dragged = null), 1000);
      };

      header.ondragover = (e) => {
        e.preventDefault();
      };

      header.ondrop = (e) => {
        e.preventDefault();
        this.reorder.push({ a: i, b: this.dragged });
        this.forceUpdate();
      };
    });
  }


  render() {
    const { data, columns } = this.props;

    const draggableColumns = columns.map(col => ({ ...col, Header: <span className="draggable-header">{col.Header}</span> }));
    this.reorder.forEach(el => (draggableColumns[el.a] = draggableColumns.splice(el.b, 1, draggableColumns[el.a])[0]));

    return (<ReactTable ref={r => this.reactTable = r} {...this.props} data={data} columns={draggableColumns} />);
  }
}
