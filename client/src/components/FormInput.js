import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function FormInput(props) {
  const { className, onChange, value, placeholder, type, leftIcon, rightIcon } = props;

  const fieldClasses = classNames({
    field: true,
    [className]: true,
  });

  const controlClasses = classNames({
    control: true,
    "has-icons-left": !!leftIcon,
    "has-icons-right": !!rightIcon,
  });

  return (
    <div className={fieldClasses}>
      <p className={controlClasses} style={{ borderRadius: "15px" }}>
        <input
          className="input"
          type={type}
          placeholder={placeholder}
          onChange={onChange}
          value={value}
          style={{
            borderTopRightRadius: ".5rem",
            borderBottomRightRadius: ".5rem",
            borderColor: "#00A09E",
            borderWidth: "1px",
            paddingLeft: "3rem",
            fontSize: "1.3rem",
            color: "#00A09E",
          }}
        />
        {leftIcon && (
          <span
            className="icon is-left"
            style={{ backgroundColor: "#00A09E", borderTopLeftRadius: ".5rem", borderBottomLeftRadius: ".5rem", height: "2.9rem" }}
          >
            <FontAwesomeIcon icon={leftIcon} />
          </span>
        )}
        {rightIcon && (
          <span className="icon is-right">
            <FontAwesomeIcon icon={rightIcon} />
          </span>
        )}
      </p>
    </div>
  );
}

FormInput.defaultProps = {
  className: "",
  leftIcon: undefined,
  rightIcon: undefined,
  type: "text",
};

FormInput.propTypes = {
  className: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  leftIcon: PropTypes.object,
  rightIcon: PropTypes.object,
  type: PropTypes.string,
};
