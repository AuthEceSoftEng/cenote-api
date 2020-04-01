import React from "react";
import PropTypes from "prop-types";
import { ClipLoader } from "react-spinners";
import * as moment from "moment";

const MostRecentEvents = (props) => {
  const { properties, events } = props;
  return (
    <div className="container is-fluid" style={{ display: "block", overflowX: "auto", whiteSpace: "nowrap" }}>
      {
        Object.keys(events).length
          ? (
            <table
              className="table has-text-centered"
              align="center"
              style={{ borderCollapse: "collapse", borderRadius: "1rem", overflow: "hidden" }}
            >
              <thead>
                <tr>
                  <th className="has-text-centered"><abbr title="Serial Number">No.</abbr></th>
                  {
                    properties.map((prop, ind) => (
                      <th key={`th_key_${ind}`} className="has-text-centered">{prop.column_name}</th>
                    ))
                  }
                </tr>
              </thead>
              <tbody>
                {
                  events.map((prop, ind) => (
                    <tr key={`tr_key_${ind}`}>
                      <th className="has-text-centered">{ind + 1}</th>
                      {
                        properties.map((prop2, ind2) => (
                          <td
                            key={`td_key_${ind2}`}
                            className={`has-text-centered ${
                              prop2.column_name.startsWith("cenote") || prop2.column_name.startsWith("uuid") ? "has-text-danger" : "has-text-info"}`}
                          >
                            {prop[prop2.column_name] !== null ? ["cenote$created_at", "cenote$timestamp"].includes(prop2.column_name)
                              ? moment(prop[prop2.column_name]).format("LTS, DD/MM/YYYY")
                              : prop[prop2.column_name] : "-"}
                          </td>
                        ))
                      }
                    </tr>
                  ))
                }
              </tbody>
            </table>
          ) : (<ClipLoader color="#008B8B" />)
      }
    </div>
  );
};

MostRecentEvents.propTypes = { properties: PropTypes.array.isRequired, events: PropTypes.array.isRequired };

export default MostRecentEvents;
