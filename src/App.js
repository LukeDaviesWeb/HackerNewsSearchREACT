import React, { Component } from 'react';
import ReactDOM from 'react-dom'
import { sortBy } from 'lodash';
import classNames from 'classnames';
import './App.css';
import {Icon} from 'react-fa'




const DEFAULT_QUERY = 'redux';
const DEFAULT_PAGE = 0;
const DEFAULT_HPP ='50';

const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';


const largeColumn = {
  width: '40%',
};
const midColumn = {
  width: '30%',
};
const smallColumn = {
  width: '10%',
};



const Search = ({value, onChange,onSubmit,children}) =>
      <form onSubmit={onSubmit}>
        <input
          className="search_bar" 
          type = "text"
          value = {value}
          onChange={onChange}
        />
        <button 
          type="submit"
          className="submit_button"
        >
          <Icon 
            name="search" 
            size = "2x"
            className = "search_icon"
           />
        </button>
      </form>

const Table = ({list, sortKey, isSortReverse, onSort, onDismiss}) => {
  const sortedList = SORTS[sortKey](list);
  const reverseSortedList = isSortReverse 
    ? sortedList.reverse()
    : sortedList; 
  return(
    <div className = "table">
      <div className="table-header">
        <span style={{ width: '40%' }}>

          <Sort
            sortKey={'TITLE'}
            onSort={onSort}
            activeSort={sortKey}
          >
            Title
          </Sort>
        </span>

        <span style={{ width: '30%' }}>
          <Sort
          sortKey={'AUTHOR'}
          onSort={onSort}
          activeSort={sortKey}
          >
            Author
          </Sort>
        </span>

        <span style={{ width: '10%' }}>
          <Sort
          sortKey={'COMMENTS'}
          onSort={onSort}
          activeSort={sortKey}
          >
            Comments
          </Sort>
        </span>

        <span style={{ width: '10%' }}>
          <Sort
          sortKey={'POINTS'}
          onSort={onSort}
          activeSort={sortKey}
          >
           Points
          </Sort>
        </span>

        <span style={{ width: '10%' }}>
          Archive
        </span>
      </div>
      { reverseSortedList.map(item =>
        <div key = {item.objectID} className = "table-row">
          <span style = {largeColumn}>
            <a href={item.url}>{item.title}</a>
          </span>
          <span style = {midColumn}>
            {item.author}
          </span>
          <span style = {smallColumn}>
            {item.num_comments}
          </span>
          <span style = {smallColumn}>
            {item.points}
          </span>
          <span style = {smallColumn}>
            <button
              onClick={() => onDismiss(item.objectID)}
              className="button-inline"
            >Dismiss
            </button>
          </span>
        </div>
        )}
      </div>
    );
}

const Sort = ({
    sortKey,
    activeSortKey,
    onSort,
    children
  }) => {
    const sortClass = classNames(
      'button-inline',
      { 'button-active': sortKey === activeSortKey }
    );
  return (
    <Button
    onClick={() => onSort(sortKey)}
    className={sortClass}
    >
    {children}
    </Button>
  );
}



const Button = ({onClick, className, children}) =>
  <button
    onClick={onClick}
    className={className}
    type ="button"
  >{children} 
    
  </button>

const Loading = () =>
    <div>
      <span> <Icon 
                spin = 'true'
                name="spinner" 
                size = "4x"
                className = "load_spin"
              />
      </span>
    </div>

const withLoading = (Component) => ({ isLoading, ...rest }) =>
isLoading ? <Loading /> : <Component { ...rest } />

const SORTS = {
  NONE: list => list, 
  TITLE: list => sortBy(list, 'title'),
  AUTHOR: list => sortBy(list, 'author'),
  COMMENTS: list => sortBy(list, 'num_comments').reverse(),
  POINTS: list => sortBy(list, 'points').reverse(),
};

class App extends Component {
  //constructor function sets the initial internal component state  
  constructor(props){
    super(props);

    this.state = {
      results: null,
      searchKey: '',
      searchTerm: DEFAULT_QUERY,
      isLoading: false,
      sortKey: 'NONE',
      isSortReverse: false,
    }; 

    this.needsToSearchTopStories = this.needsToSearchTopStories.bind(this);
    this.setSearchTopStories = this.setSearchTopStories.bind(this);
    this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSort = this.onSort.bind(this);
  }

  onSort(sortKey){
    const isSortReverse = this.state.sortKey === sortKey && !this.state.isSortReverse;
      this.setState({ sortKey, isSortReverse});
  }

  needsToSearchTopStories(searchTerm){
    return !this.state.results[searchTerm];
  }

  setSearchTopStories(result){
    const { hits, page } = result;
    const { searchKey, results} = this.state;

    const oldHits = results && results[searchKey]
      ? results[searchKey].hits 
      : [];

    const updatedHits = [
      ...oldHits,
      ...hits
    ];

    this.setState({
      results: {
        ...results,
        [searchKey] : { hits: updatedHits, page }
      },
      isLoading: false
    });
  }

  fetchSearchTopStories(searchTerm, page){
    this.setState({ isLoading: true });

    fetch(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
      .then(response => response.json())
      .then(result => this.setSearchTopStories(result));
  }

  componentDidMount(){
    const { searchTerm } =this.state;
    this.setState({ searchKey : searchTerm});
    this.fetchSearchTopStories(searchTerm, DEFAULT_PAGE);
  }

  onSearchSubmit(event){
    const { searchTerm } = this.state;
    this.setState({ searchKey : searchTerm});
    this.fetchSearchTopStories(searchTerm, DEFAULT_PAGE);

    if(this.needsToSearchTopStories(searchTerm)) {
      this.fetchSearchTopStories(searchTerm, DEFAULT_PAGE);
    }

    event.preventDefault();
  } 

  onDismiss(id){
    const { searchKey, results } =this.state;
    const { hits, page } = results[searchKey];

    const isNotId = item => item.objectID !== id;
    const updatedHits = hits.filter(isNotId);

    this.setState({
      results : {
        ...results,
        [searchKey]: { hits: updatedHits, page} 
      } 
    });
  }

  onSearchChange(event){
    this.setState({ searchTerm : event.target.value});

  }
  //render function is what will be displayed on the screen when the class is called
  render() {
    const { 
      searchTerm, 
      results,
      searchKey,
      isLoading,
      sortKey,
      isSortReverse
    } = this.state;

    const page = (
      results && 
      results[searchKey]&&
      results[searchKey].page
    ) || 0;

    const list = (
      results &&
      results[searchKey]&&
      results[searchKey].hits
    ) || [];

    return (
      <div className="Page">
        <div className="interactions">
          <Search
            value={searchTerm}
            onChange={this.onSearchChange}
            onSubmit={this.onSearchSubmit}
          >Search 
          </Search>
        </div>
        <Table
          list={list}
          sortKey = {sortKey}
          isSortReverse = {isSortReverse}
          onSort = {this.onSort}
          onDismiss={this.onDismiss}
        /> 
        <div className="interactions">
          { isLoading
            ? <Loading />
            : <Button 
              onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}>
              More
              </Button>
          }
        </div>
      </div>
    );     
  }
}







            
export default App;

export {
  Button, 
  Search, 
  Table,
};
