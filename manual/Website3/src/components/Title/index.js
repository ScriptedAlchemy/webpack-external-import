import React from "react";
import "react-select";
import "./style.css";

export const Title = ({ title }) => {
  window.wasExternalFunctionCalled = true;
  return (
    <h1 className="with-css">
      TITLE COMPONENT:
      {title}
    </h1>
  );
};

