import React from "react";
import "react-select";
import "./style.css";
import { Field } from "tiny-mobx-form";

export const Title = ({ title }) => {
  console.log("tree-shake: IValidator", Field);
  return (
    <h1 className="inline-css">
      TITLE COMPONENT:
      {title}
    </h1>
  );
};
