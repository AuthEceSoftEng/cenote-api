import React, { Component } from "react";

class Clock extends Component {
  constructor() {
    super();
    const newDate = new Date();
    const date = `${newDate.getHours()}:${newDate.getMinutes()}:${newDate.getSeconds()}`;
    this.state = { date };
  }

  componentDidMount() {
    this.startTime();
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  startTime() {
    this.timer = setInterval(() => {
      const newDate = new Date();
      const date = `${newDate.getHours().toString().padStart(2, 0)}:${
        newDate.getMinutes().toString().padStart(2, 0)}:${newDate.getSeconds().toString().padStart(2, 0)}`;
      this.setState(() => ({ date }));
    }, 1000);
  }

  render() {
    const { date } = this.state;
    return (
      <div>
        <div className="display-time">{date}</div>
      </div>
    );
  }
}

export default Clock;
