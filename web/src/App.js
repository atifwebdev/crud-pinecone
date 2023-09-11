import { useState, useRef, useEffect } from "react";
import axios from "axios";
import logo from './logo.svg';
import './App.css';

const baseUrl = 'http://localhost:5001';

function App() {
  const titleInputRef = useRef(null);
  const bodyInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const [alert, setAlert] = useState("");

  const [data, setData] = useState([]);

  useEffect(() => {
    if (alert) {
      setTimeout(() => {
        setAlert("");
        console.log("time out");
      }, 4000)
      console.log("effect");
    }
  }, [alert]);

  useEffect(() => {
    getAllStories();
  }, []);

  const getAllStories = async () => {
    try {
      setIsLoading(true);
      const resp = await axios.get(`${baseUrl}/api/v1/stories`)
      console.log(resp.data);
      setData(resp.data);

      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      console.log(e);
    }
  }

  const postStory = async (event) => {
    event.preventDefault();

    try {
      setIsLoading(true);

      const response = await axios.post(`${baseUrl}/api/v1/story`, {
        title: titleInputRef.current.value,
        body: bodyInputRef.current.value,
      });
      console.log("response: ", response.data);

      setIsLoading(false);
      getAllStories();
      setAlert(response?.data?.message);
      event.target.reset();
    } catch (e) {
      setIsLoading(false);
      console.log(e);
    }
  };

  const deleteHandler = async (id) => {
    try {
      setIsLoading(true);

      const response = await axios.delete(`${baseUrl}/api/v1/story/${id}`);
      console.log("response: ", response.data);

      setIsLoading(false);
      setAlert(response?.data?.message);
      getAllStories();
    } catch (e) {
      setIsLoading(false);
      console.log(e);
    }
  }

  return (
    <div>
      <div className="postForm">
      <h1>Social Stories</h1>

      <form onSubmit={postStory}>
        <label htmlFor="titleInput">Story Title: </label>
        <input
          type="text"
          id="titleInput"
          maxLength={20}
          minLength={2}
          required
          ref={titleInputRef}
        />
        <label htmlFor="bodyInput">Story Description: </label>
        <textarea
          type="text"
          id="bodyInput"
          maxLength={999}
          minLength={10}
          required
          ref={bodyInputRef}></textarea>
        <button type="submit">Post</button>
      </form>
      </div>
      
      <div className="postData">
      {(data.length) ? (
        data.map((eachPostrData, index) =>
          <div className="postBox" key={index}>
            <h2>{eachPostrData?.metadata?.title}</h2>
            <p>{eachPostrData?.metadata?.body}</p>
            <button onClick={() => {
                    deleteHandler(eachPostrData?.id)
                  }}>Delete</button>
          </div>)

      ) : null}
      </div>

    </div>
  );
}

export default App;
