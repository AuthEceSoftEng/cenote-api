import React from "react";

import { ChangeUsername, ChangePassword, ChangeEmail } from "../../components";


export default function Account() {
  return (
    <div className="account-settings">
      <ChangeUsername />
      <ChangeEmail />
      <ChangePassword />
    </div>
  );
}
