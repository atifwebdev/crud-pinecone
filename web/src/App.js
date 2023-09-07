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
    const resp = await axios.get(`${baseUrl}/api/v1/stories`)
    console.log(resp.data);

    setData(resp.data);
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

      setAlert(response?.data?.message);
      event.target.reset();
    } catch (e) {
      setIsLoading(false);
      console.log(e);
    }
  };

  return (
    <div>
      <h1>Social Stories</h1>

      <form onSubmit={postStory}>
        <label htmlFor="titleInput">Title: </label>
        <input
          type="text"
          id="titleInput"
          maxLength={20}
          minLength={2}
          required
          ref={titleInputRef}
        />
        <br />
        <label htmlFor="bodyInput">what is in your mind: </label>
        <textarea
          type="text"
          id="bodyInput"
          maxLength={999}
          minLength={10}
          required
          ref={bodyInputRef}
        ></textarea>

        <br />
        <button type="submit">Post</button>
      </form>

      <br />
      <hr />
      <br />


      {(data.length) ? (

        data.map((eachPostrData, index) =>
          <div key={index}>
            <h2>{eachPostrData?.metadata?.title}</h2>
            <p>{eachPostrData?.metadata?.body}</p>
          </div>)

      ) : null}


    </div>
  );
}

export default App;
