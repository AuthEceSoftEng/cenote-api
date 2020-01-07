import React from 'react';
import PropTypes from 'prop-types';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import request from 'superagent';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import ReactTable from 'react-table';
import * as moment from 'moment';
import DownloadLink from 'react-download-link';
import { parse } from 'json2csv';
import { ClipLoader } from 'react-spinners';

import { handleSuccess, handleError } from '../../api/helpers';
import { EventCollection, Analytics, Collaborators } from './components';
import { getEventCollections, getRecentEvents, getEventCount } from './utils';
import { Button } from '..';


export default class Dashboard extends React.Component {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    collaborators: PropTypes.array.isRequired,
    title: PropTypes.string.isRequired,
    readKeys: PropTypes.array.isRequired,
    writeKeys: PropTypes.array.isRequired,
    masterKeys: PropTypes.array.isRequired,
    updateProjectReadKey: PropTypes.func.isRequired,
    updateProjectWriteKey: PropTypes.func.isRequired,
    updateProjectMasterKey: PropTypes.func.isRequired,
    owner: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      collaborators: props.collaborators,
      owner: props.owner,
      readKeys: props.readKeys,
      writeKeys: props.writeKeys,
      title: props.title,
      masterKeys: props.masterKeys,
      editRead: new Array(props.readKeys.length).fill(false),
      editWrite: new Array(props.writeKeys.length).fill(false),
      editMaster: new Array(props.readKeys.length).fill(false),
      collections: {},
      events: {},
      eventCounts: {},
      selectedCollection: 0,
    };
    this._isMounted = false;
    this.deleteCollection = this.deleteCollection.bind(this);
    this.setCollaborators = this.setCollaborators.bind(this);
    this.downloadData = this.downloadData.bind(this);
  }

  componentDidMount() {
    this._isMounted = true;
    const { projectId } = this.props;
    const { readKeys } = this.state;
    getEventCollections(projectId).then((collections) => {
      if (this._isMounted) this.setState({ collections });

      const events = {};
      const eventCounts = {};
      const promises = [];
      Object.keys(collections).forEach((col) => {
        promises.push(getRecentEvents(projectId, col, readKeys[0], 5).then(evts => events[col] = evts));
        promises.push(getEventCount(projectId, col, readKeys[0]).then(count => eventCounts[col] = count));
      });
      Promise.all(promises).then(() => this._isMounted && this.setState({ events, eventCounts }));
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  setCollaborators(collaborators) {
    this.setState({ collaborators });
  }

  updateProjectReadKey = () => {
    const { readKeys } = this.state;
    const { updateProjectReadKey, projectId } = this.props;
    updateProjectReadKey({ projectId, readKeys }).then(() => this.setState({ editRead: new Array(readKeys.length).fill(false) }));
  }

  updateProjectWriteKey = () => {
    const { writeKeys } = this.state;
    const { updateProjectWriteKey, projectId } = this.props;
    updateProjectWriteKey({ projectId, writeKeys }).then(() => this.setState({ editWrite: new Array(writeKeys.length).fill(false) }));
  }

  updateProjectMasterKey = () => {
    const { masterKeys } = this.state;
    const { updateProjectMasterKey, projectId } = this.props;
    updateProjectMasterKey({ projectId, masterKeys }).then(() => this.setState({ editWrite: new Array(masterKeys.length).fill(false) }));
  }

  updateRead = (value, ind) => this.setState((prevState) => {
    prevState.readKeys[ind] = value;
    return ({ readKey: prevState.readKeys });
  })

  updateWrite = (value, ind) => this.setState((prevState) => {
    prevState.writeKeys[ind] = value;
    return ({ writeKeys: prevState.writeKeys });
  })

  updateMaster = (value, ind) => this.setState((prevState) => {
    prevState.masterKeys[ind] = value;
    return ({ masterKeys: prevState.masterKeys });
  })

  editRead = (i) => {
    let { editRead, editWrite, editMaster } = this.state;
    if (editRead[i]) {
      editRead[i] = false;
      this.setState({ editRead });
    } else {
      editRead = new Array(editRead.length).fill(false);
      editWrite = new Array(editWrite.length).fill(false);
      editMaster = new Array(editMaster.length).fill(false);
      editRead[i] = true;

      this.setState({ editRead, editWrite, editMaster });
    }
  }

  editWrite = (i) => {
    let { editRead, editWrite, editMaster } = this.state;
    if (editWrite[i]) {
      editWrite[i] = false;
      this.setState({ editWrite });
    } else {
      editRead = new Array(editRead.length).fill(false);
      editWrite = new Array(editWrite.length).fill(false);
      editMaster = new Array(editMaster.length).fill(false);
      editWrite[i] = true;

      this.setState({ editRead, editWrite, editMaster });
    }
  }

  editMaster = (i) => {
    let { editRead, editWrite, editMaster } = this.state;
    if (editMaster[i]) {
      editMaster[i] = false;
      this.setState({ editMaster });
    } else {
      editRead = new Array(editRead.length).fill(false);
      editWrite = new Array(editWrite.length).fill(false);
      editMaster = new Array(editMaster.length).fill(false);
      editMaster[i] = true;

      this.setState({ editRead, editWrite, editMaster });
    }
  }

  regenRead = (i) => {
    const { projectId } = this.props;
    const { readKeys } = this.state;
    request.post(`/api/projects/${projectId}/keys/regenerate`).send({ readKey: readKeys[i] }).then(handleSuccess).catch(handleError)
      .then(({ readKey }) => {
        readKeys[i] = readKey;
        this.setState(readKeys);
      });
  }

  regenWrite = (i) => {
    const { projectId } = this.props;
    const { writeKeys } = this.state;
    request.post(`/api/projects/${projectId}/keys/regenerate`).send({ writeKey: writeKeys[i] }).then(handleSuccess).catch(handleError)
      .then(({ writeKey }) => {
        writeKeys[i] = writeKey;
        this.setState(writeKeys);
      });
  }

  regenMaster = (i) => {
    const { projectId } = this.props;
    const { masterKeys } = this.state;
    request.post(`/api/projects/${projectId}/keys/regenerate`).send({ masterKey: masterKeys[i] }).then(handleSuccess).catch(handleError)
      .then(({ masterKey }) => {
        masterKeys[i] = masterKey;
        this.setState(masterKeys);
      });
  }

  async downloadData() {
    const { projectId } = this.props;
    const { collections, selectedCollection, readKeys, eventCounts } = this.state;
    this.setState({ loading: true });
    const data = await getRecentEvents(
      projectId,
      Object.keys(collections)[selectedCollection],
      readKeys[0],
      eventCounts[Object.keys(collections)[selectedCollection]],
    );
    this.setState({ loading: false });
    return parse(data);
  }

  deleteCollection(col) {
    const { collections } = this.state;
    const { projectId } = this.props;
    Swal.fire({
      title: 'Are you sure?',
      text: 'Once deleted, you will not be able to recover data lost!',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
      showLoaderOnConfirm: true,
      preConfirm: () => request.delete(`/api/projects/${projectId}/queries/dropTable`).send({ event_collection: col })
        .then(info => info).catch(error => Swal.showValidationMessage(`Request failed: ${error}`)),
      allowOutsideClick: () => !Swal.isLoading(),
    }).then((result) => {
      if (result.value.body) {
        delete collections[col];
        this.setState({ collections });
        Swal.fire({
          title: 'Poof!',
          text: 'Your collection has been deleted!',
          type: 'success',
          confirmButtonText: 'Nice!',
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire('Cancelled', 'Your collection is safe :)', 'error');
      }
    });
  }

  _getEventCollectionInfo() {
    const { collections, events, eventCounts, selectedCollection, loading } = this.state;
    const { projectId } = this.props;
    const tabList = [];
    const tabPanel = [];
    Object.keys(collections).forEach((col, ind) => {
      tabList.push(
        <Tab key={`tab_col_${ind}`}>
          {col}
          <span className="icon" role="button" tabIndex={-1} onKeyPress={() => this.deleteCollection(col)} onClick={() => this.deleteCollection(col)}>
            <FontAwesomeIcon icon={faTrashAlt} size="sm" />
          </span>
        </Tab>,
      );
      let headerMessage = '';
      if (!eventCounts[col]) {
        headerMessage = 'last events...';
      } else {
        if (eventCounts[col] > 0) headerMessage = `last ${eventCounts[col]}, of ${eventCounts[col]} events...`;
        if (eventCounts[col] > 5) headerMessage = `last 5, of ${eventCounts[col]} events...`;
      }
      tabPanel.push(
        <TabPanel key={`tabpanel_col_${ind}`}>
          <hr style={{ backgroundColor: '#10447a', height: '1px' }} />
          <EventCollection properties={collections[col]} projectId={projectId} eventCollection={col} />
          <h4 style={{ marginTop: '1%' }} className="title is-4">{headerMessage}</h4>
          {events[col] ? (
            <ReactTable
              showPageSizeOptions={false}
              showPagination={false}
              defaultPageSize={5}
              data={events[col] || []}
              columns={collections[col].map(el => ({
                Header: el.column_name,
                accessor: el.column_name,
                minWidth: 200,
                Cell: props => (
                  <span className={`has-text-centered ${
                    el.column_name.startsWith('cenote') || el.column_name.startsWith('uuid') ? 'has-text-danger' : 'has-text-info'}`}
                  >
                    {['cenote$created_at', 'cenote$timestamp'].includes(el.column_name)
                      ? moment(props.value).format('LTS, DD/MM/YYYY')
                      : props.value}
                  </span>
                ),
              }))}
              className="-striped -highlight"
            />
          ) : null}
        </TabPanel>,
      );
    });
    if (tabList.length === 0) return (<div><p>None yet. Send some events!</p></div>);
    return (
      <Tabs forceRenderTabPanel onSelect={ind => this.setState({ selectedCollection: ind })}>
        <TabList>{tabList}</TabList>
        {
          eventCounts[Object.keys(collections)[selectedCollection]] && (
            loading
              ? <ClipLoader color="#008B8B" />
              : (
                <DownloadLink
                  className="button is-primary"
                  filename={`${projectId}_${Object.keys(collections)[selectedCollection]}.csv`}
                  exportFile={this.downloadData}
                  tagName="button"
                  label="Export event collection to CSV!"
                  style={{}}
                />
              )
          )
        }
        {tabPanel}
      </Tabs>
    );
  }

  render() {
    const { readKeys, title, writeKeys, masterKeys, editRead, editWrite, editMaster, collections, collaborators, owner } = this.state;
    const { projectId } = this.props;
    return (
      <div>
        <h1 className="title is-1">{title}</h1>
        <hr style={{ backgroundColor: '#10447a', height: '1px' }} />
        <Tabs forceRenderTabPanel defaultIndex={0} defaultFocus>
          <TabList>
            <Tab>Event Collections</Tab>
            <Tab>Project Information</Tab>
            <Tab style={{ backgroundColor: '#00A09E', color: 'white' }}>Review Events</Tab>
          </TabList>
          <TabPanel>
            {this._getEventCollectionInfo()}
          </TabPanel>
          <TabPanel>
            <Tabs forceRenderTabPanel>
              <TabList>
                <Tab>Project</Tab>
                <Tab>Keys</Tab>
                <Tab>Collaborators</Tab>
              </TabList>
              <TabPanel>
                <hr style={{ backgroundColor: '#10447a', height: '1px' }} />
                <div className="container is-fluid">
                  <table
                    className="table has-text-centered"
                    align="center"
                    style={{ borderCollapse: 'collapse', borderRadius: '1rem', overflow: 'hidden' }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: '#10447a' }}>
                        <th className="has-text-centered" style={{ color: 'white' }}>Project Name</th>
                        <th className="has-text-centered" style={{ color: 'white' }}>Project ID</th>
                        <th className="has-text-centered" style={{ color: 'white' }}>Project Owner</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th className="has-text-centered has-text-danger">{title}</th>
                        <td className="has-text-centered has-text-grey">{projectId}</td>
                        <td className="has-text-centered has-text-primary">{owner}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabPanel>
              <TabPanel>
                <hr style={{ backgroundColor: '#10447a', height: '1px' }} />
                <div className="container is-fluid">
                  <table
                    className="table has-text-centered"
                    align="center"
                    style={{ borderCollapse: 'collapse', borderRadius: '1rem', overflow: 'hidden' }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: '#10447a' }}>
                        <th className="has-text-centered is-vcentered" style={{ color: 'white' }}>Key</th>
                        <th className="has-text-centered" style={{ color: 'white' }}>Value</th>
                        <th className="has-text-centered" style={{ color: 'white' }}>Options</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        readKeys.map((key, ind) => (
                          <tr key={`rowread${ind}`}>
                            <th className="has-text-centered" style={{ color: '#00A09E', verticalAlign: 'middle' }}>Read key</th>
                            {editRead[ind]
                              ? (
                                <td className="has-text-centered has-text-grey">
                                  <input
                                    className="input"
                                    type="text"
                                    value={key}
                                    onChange={({ target }) => this.updateRead(target.value, ind)}
                                    ref={inpt => inpt && inpt.focus()}
                                  />
                                </td>
                              )
                              : (<td className="has-text-centered has-text-grey" style={{ verticalAlign: 'middle' }}>{key}</td>)}
                            {editRead[ind]
                              ? (
                                <td>
                                  <Button
                                    label="Change!"
                                    type="danger"
                                    onClick={() => { this.editRead(ind); this.updateProjectReadKey(ind); }}
                                  />

                                </td>
                              )
                              : (<td><Button label="Regenerate" type="info" onClick={() => this.regenRead(ind)} /></td>)
                            }
                          </tr>
                        ))
                      }
                      {
                        writeKeys.map((key, ind) => (
                          <tr key={`rowwrite${ind}`}>
                            <th className="has-text-centered" style={{ color: '#00A09E', verticalAlign: 'middle' }}>Write key</th>
                            {editWrite[ind]
                              ? (
                                <td className="has-text-centered has-text-grey">
                                  <input
                                    className="input"
                                    type="text"
                                    value={key}
                                    onChange={({ target }) => this.updateWrite(target.value, ind)}
                                    ref={inpt => inpt && inpt.focus()}
                                  />
                                </td>
                              )
                              : (<td className="has-text-centered has-text-grey" style={{ verticalAlign: 'middle' }}>{key}</td>)}
                            {editWrite[ind]
                              ? (
                                <td>
                                  <Button
                                    label="Change!"
                                    type="danger"
                                    onClick={() => { this.editWrite(ind); this.updateProjectWriteKey(); }}
                                  />

                                </td>
                              )
                              : (<td><Button label="Regenerate" type="info" onClick={() => this.regenWrite(ind)} /></td>)
                            }
                          </tr>
                        ))
                      }
                      {
                        masterKeys.map((key, ind) => (
                          <tr key={`rowmaster${ind}`}>
                            <th className="has-text-centered" style={{ color: '#00A09E', verticalAlign: 'middle' }}>Master key</th>
                            {editMaster[ind]
                              ? (
                                <td className="has-text-centered has-text-grey">
                                  <input
                                    className="input"
                                    type="text"
                                    value={key}
                                    onChange={({ target }) => this.updateMaster(target.value, ind)}
                                    ref={inpt => inpt && inpt.focus()}
                                  />
                                </td>
                              )
                              : (<td className="has-text-centered has-text-grey" style={{ verticalAlign: 'middle' }}>{key}</td>)}
                            {editMaster[ind]
                              ? (
                                <td>
                                  <Button
                                    label="Change!"
                                    type="danger"
                                    onClick={() => { this.editMaster(ind); this.updateProjectMasterKey(ind); }}
                                  />

                                </td>
                              )
                              : (<td><Button label="Regenerate" type="info" onClick={() => this.regenMaster(ind)} /></td>)
                            }
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </TabPanel>
              <TabPanel>
                <hr style={{ backgroundColor: '#10447a', height: '1px' }} />
                <Collaborators projectId={projectId} collaborators={collaborators} setCollaborators={this.setCollaborators} />
              </TabPanel>
            </Tabs>
          </TabPanel>
          <TabPanel>
            <hr style={{ backgroundColor: '#10447a', height: '1px' }} />
            <Analytics collections={collections} projectId={projectId} readKey={readKeys[0]} />
          </TabPanel>
        </Tabs>
      </div>
    );
  }
}
