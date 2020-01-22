import React from "react";
import "react-select";
import "./style.css";

export const Title = ({ title }) => {
  window.wasExternalFunctionCalled = true;
  console.log("TitleComponent interleaving successful");
  return (
    <h1 className="inline-css">
      TITLE COMPONENT:
      {title}
    </h1>
  );
};

/* externalize:TitleComponent */
