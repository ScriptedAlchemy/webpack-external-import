import React from "react";
import "react-select";

export const Title = ({ title }) => {
    window.wasExternalFunctionCalled = true;
    console.log("TitleComponent interleaving successful");
  return (
    <h1>
      TITLE COMPONENT:
      {title}
    </h1>
  );
};

/* externalize:TitleComponent */
