/* eslint-disable jsx-a11y/label-has-associated-control, no-bitwise */
import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { ClipLoader } from 'react-spinners';
import * as moment from 'moment';
import DatePicker from 'react-datepicker';
import mem from 'mem';
import DownloadLink from 'react-download-link';
import { parse } from 'json2csv';

import { getRecentEvents } from '../utils';
import { DraggableTable } from '.';

const getRecentEventsAndCache = mem(getRecentEvents);

export default class Analytics extends React.Component {
  static propTypes = { collections: PropTypes.object, readKey: PropTypes.string.isRequired, projectId: PropTypes.string.isRequired }

  static defaultProps = { collections: {} }

  constructor(props) {
    super(props);
    this.state = {
      collections: props.collections,
      loading: false,
      columns: [],
      selectedCollection: { value: '---', label: '---' },
      selectedColumns: [],
      selectedInterval: { value: 'this_year', label: 'this year' },
      tableData: {
        events: null,
        properties: null,
      },
      startDate: moment().startOf('hour').toDate(),
      endDate: moment().subtract(1, 'week').startOf('hour').toDate(),
    };
    this.input = React.createRef();
    this.getEvents = this.getEvents.bind(this);
    this.handleCollectionChange = this.handleCollectionChange.bind(this);
    this.handleColumnChange = this.handleColumnChange.bind(this);
    this.handleIntervalChange = this.handleIntervalChange.bind(this);
    this.handleCustomStartDateChange = this.handleCustomStartDateChange.bind(this);
    this.handleCustomEndDateChange = this.handleCustomEndDateChange.bind(this);
    this.downloadData = this.downloadData.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ collections: nextProps.collections });
  }

  getEvents() {
    const {
      selectedCollection: { value: collection },
      selectedColumns,
      selectedInterval: { value: interval },
      collections,
      startDate,
      endDate,
    } = this.state;
    const { projectId, readKey } = this.props;
    if (collection === '---') return;
    this.setState({ loading: true });
    getRecentEventsAndCache(projectId, collection, readKey, parseInt(this.input.current.value || 2e3, 10)).then((tableData) => {
      if (interval === 'custom_timeframe') {
        tableData.events = tableData.filter(el => moment(el.cenote$timestamp).isBetween(startDate, endDate));
      } else {
        tableData.events = tableData.filter((el) => {
          let filterClause = moment(el.cenote$timestamp).year() === moment().year();
          if (interval === 'this_year') return filterClause;
          filterClause &= moment(el.cenote$timestamp).month() === moment().month();
          if (interval === 'this_month') return filterClause;
          filterClause &= moment(el.cenote$timestamp).isoWeek() === moment().isoWeek();
          if (interval === 'this_week') return filterClause;
          filterClause &= moment(el.cenote$timestamp).dayOfYear() === moment().dayOfYear();
          return filterClause;
        });
      }
      tableData.properties = collections[collection];
      if (selectedColumns.length > 0) {
        const columns = selectedColumns.map(el => el.value);
        tableData.events = tableData.events.map(el => Object.keys(el)
          .filter(key => columns.includes(key))
          .reduce((obj, key) => {
            obj[key] = el[key];
            return obj;
          }, {}));
        tableData.properties = tableData.properties.filter(el => columns.includes(el.column_name));
      }
      this.setState({ tableData, loading: false });
    });
  }

  handleCollectionChange = (selectedCollection) => {
    const { collections } = this.state;
    const columns = collections[selectedCollection.value].map(el => el.column_name);
    this.setState({
      columns,
      selectedCollection,
      selectedColumns: [],
      tableData: { events: [], properties: [] },
    }, this.getEvents);
  }

  handleColumnChange = (selectedColumns) => {
    this.setState({ selectedColumns }, this.getEvents);
  }

  handleIntervalChange = (selectedInterval) => {
    this.setState({ selectedInterval }, this.getEvents);
  }

  handleCustomStartDateChange = (startDate) => {
    this.setState({ startDate }, this.getEvents);
  }

  handleCustomEndDateChange = (endDate) => {
    this.setState({ endDate }, this.getEvents);
  }

  downloadData() {
    const { tableData: { events: data } } = this.state;
    return parse(data);
  }

  render() {
    const { collections, selectedCollection, selectedColumns, columns, tableData, loading, selectedInterval, startDate, endDate } = this.state;
    const { projectId } = this.props;
    const collectionNames = Object.keys(collections);
    return (
      <div>
        <div className="field is-horizontal" style={{ justifyContent: 'center', alignItems: 'inherit' }}>
          <div className="field is-horizontal" style={{ flex: 1, alignItems: 'center' }}>
            <div className="field-label is-normal">
              <label className="label">From collection:</label>
            </div>
            <div className="field-body">
              <div style={{ width: '100%', height: '80%' }}>
                <Select
                  value={selectedCollection}
                  onChange={this.handleCollectionChange}
                  options={collectionNames.map(el => ({ value: el, label: el }))}
                  placeholder="---"
                />
              </div>
            </div>
          </div>
          <div className="field is-horizontal" style={{ flex: 1, alignItems: 'center' }}>
            <div className="field-label is-normal">
              <label className="label">fetch column:</label>
            </div>
            <div className="field-body">
              <div style={{ width: '100%', height: '80%' }}>
                <Select
                  isMulti
                  value={selectedColumns}
                  onChange={e => this.handleColumnChange(e)}
                  options={columns.map(el => ({ value: el, label: el }))}
                  defaultValue={[]}
                />
              </div>
            </div>
          </div>
          <div className="field is-horizontal" style={{ flex: 1, alignItems: 'center' }}>
            <div className="field-label is-normal">
              <label className="label">get latest:</label>
            </div>
            <div className="field-body">
              <input className="input is-normal" type="text" placeholder="2000" style={{ minHeight: '2.7rem' }} ref={this.input} />
            </div>
          </div>
          <div className="field is-horizontal" style={{ flex: 1, alignItems: 'center' }}>
            <div className="field-label is-normal">
              <label className="label">only from:</label>
            </div>
            <div className="field-body is-normal">
              <div style={{ width: '100%', height: '80%' }}>
                <Select
                  value={selectedInterval}
                  onChange={this.handleIntervalChange}
                  options={[
                    { value: 'this_year', label: 'this year' },
                    { value: 'this_month', label: 'this month' },
                    { value: 'this_week', label: 'this week' },
                    { value: 'this_day', label: 'this day' },
                    { value: 'custom_timeframe', label: 'custom timeframe' },
                  ]}
                  placeholder="this_year"
                  defaultValue="this_year"
                />
              </div>
            </div>
          </div>
          <div className="control" style={{ marginLeft: '1rem' }}>
            <button
              type="submit"
              className="button is-info"
              onClick={() => {
                mem.clear(getRecentEventsAndCache);
                this.getEvents();
              }}
              style={{ backgroundColor: '#00A09E', color: 'white', border: '2px solid #10447a', borderRadius: '5px' }}
            >
            Refresh!
            </button>
          </div>
          <div className="control" style={{ marginLeft: '1rem' }}>
            {
              selectedCollection.value !== '---' && (
              <DownloadLink
                className="button is-primary"
                filename={`${projectId}_${selectedCollection.value}_${selectedColumns.length
                  ? selectedColumns.map(el => el.value).join(',') : 'all'}.csv`}
                exportFile={this.downloadData}
                tagName="button"
                label="Export to CSV!"
                style={{}}
              />
              )
            }
          </div>
        </div>
        {
          selectedInterval.value === 'custom_timeframe' && (
          <div className="field is-horizontal" style={{ justifyContent: 'center', alignItems: 'inherit' }}>
            <div className="field is-horizontal" style={{ marginHorizontal: '1rem' }}>
              <div className="field-label is-normal" style={{ marginRight: 'unset' }}>
                <label className="label">From: </label>
              </div>
              <div className="field-body is-normal">
                <div style={{ width: '100%', height: '80%' }}>
                  <DatePicker
                    selected={startDate}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={30}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    timeCaption="time"
                    onChange={this.handleCustomStartDateChange}
                    className="input is-normal"
                  />
                </div>
              </div>
            </div>
            <div className="field is-horizontal" style={{ marginHorizontal: '1rem' }}>
              <div className="field-label is-normal" style={{ marginRight: 'unset' }}>
                <label className="label">To: </label>
              </div>
              <div className="field-body is-normal">
                <div style={{ width: '100%', height: '80%' }}>
                  <DatePicker
                    selected={endDate}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={30}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    timeCaption="time"
                    onChange={this.handleCustomEndDateChange}
                    className="input is-normal"
                  />
                </div>
              </div>
            </div>
          </div>
          )
        }

        {tableData.events && !loading ? (
          <DraggableTable
            showPageSizeOptions={false}
            filterable
            defaultPageSize={15}
            data={tableData.events}
            columns={tableData.properties.map(el => ({
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
        ) : loading ? <ClipLoader color="#008B8B" /> : null}

      </div>
    );
  }
}
