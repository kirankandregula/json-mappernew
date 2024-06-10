import React, { useContext, useState, useEffect } from "react";
import { JsonEditor as Editor } from "jsoneditor-react";
import "jsoneditor-react/es/editor.min.css";
import JsonContext from "./JsonContext";
import { useNavigate } from "react-router-dom";

const SchemaBuilder = () => {
  const { sourceJson, setSourceJson, setTargetJson } = useContext(JsonContext);
  const [editorValue, setEditorValue] = useState({});
  const [currentStep, setCurrentStep] = useState(1); // State to track current step
  const navigate = useNavigate();

  useEffect(() => {
    // Function to extract the 0 index object from an array of objects, if it exists
    const extractZeroIndexObject = (obj) => {
      const newObj = { ...obj };
      for (const key in newObj) {
        if (Array.isArray(newObj[key]) && newObj[key].length > 0) {
          if (typeof newObj[key][0] === 'object') {
            // If the value is an array of objects, take only the 0th index
            newObj[key] = [newObj[key][0]];
          }
        }
      }
      return newObj;
    };

    // Normalize sourceJson to handle array, single object, and nested arrays
    const normalizeSourceJson = (json) => {
      if (Array.isArray(json)) {
        if (json.length > 0 && Array.isArray(json[0])) {
          // If the first item is an array, take the 0th index of each nested array
          return json.map(subArray => {
            const normalizedSubArray = extractZeroIndexObject(subArray);
            return Object.keys(normalizedSubArray).length > 0 ? normalizedSubArray : {};
          });
        } else {
          return json.length > 0 ? extractZeroIndexObject(json[0]) : {};
        }
      } else if (json && typeof json === 'object') {
        return extractZeroIndexObject(json);
      }
      return {};
    };

    const normalizedValue = normalizeSourceJson(sourceJson);
    setEditorValue(normalizedValue);
  }, [sourceJson]);

  const handleEditorChange = (newValue) => {
    setEditorValue(newValue);
  };

  // Recursive function to update an object based on a template
  const updateObject = (template, obj) => {
    const updatedObj = {};
    for (const key in template) {
      if (key in obj) {
        if (Array.isArray(template[key]) && Array.isArray(obj[key])) {
          // Handle arrays of objects
          updatedObj[key] = obj[key].map(item =>
            updateObject(template[key][0], item)
          );
        } else if (typeof template[key] === 'object' && !Array.isArray(template[key])) {
          updatedObj[key] = updateObject(template[key], obj[key]);
        } else {
          updatedObj[key] = obj[key];
        }
      }
    }
    return updatedObj;
  };

  const applyDeletionsToSourceJson = () => {
    const template = editorValue;
    const updatedSourceJson = Array.isArray(sourceJson)
      ? sourceJson.map(obj => updateObject(template, obj))
      : updateObject(template, sourceJson);

    setSourceJson(updatedSourceJson);
    setCurrentStep(2); // Move to the next step
    alert("Source JSON updated with deletions");
  };

  const handleTargetButtonClick = () => {
    setTargetJson(editorValue);
    alert("Data saved in target");
    navigate('/json-mapper');
  };

  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col">
          <h3 className="text-warning">Schema Builder:</h3>
          {currentStep === 1 && (
            <>
              {Object.keys(editorValue).length > 0 ? (
                <Editor
                  value={editorValue}
                  onChange={handleEditorChange}
                  modes={["tree", "code"]}
                  mode="tree"
                  history={true}
                  search={true}
                  indentation={4}
                />
              ) : (
                <p>No source JSON available</p>
              )}
              <button className="btn btn-primary my-2" onClick={applyDeletionsToSourceJson}>
                Update Source JSON
              </button>
            </>
          )}
          {currentStep === 2 && (
            <>
              <Editor
                value={editorValue}
                onChange={handleEditorChange}
                modes={["tree", "code"]}
                mode="tree"
                history={true}
                search={true}
                indentation={4}
              />
              <button
                className="btn btn-success my-2"
                onClick={handleTargetButtonClick}
              >
                Set Target JSON
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemaBuilder;
