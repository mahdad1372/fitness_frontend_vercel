import { useState } from "react";
import { Link, useNavigate } from "react-router";
import Cookies from "js-cookie";

import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [login, setlogin] = useState(false);
  const navigate = useNavigate();

  // 🔐 LOGIN HANDLER
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("https://fitness-backend-15563671567.europe-west8.run.app/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await response.json();

      // ✅ Save token in cookie
      Cookies.set("token", data.token, {
        expires: 1, // 1 day
        sameSite: "strict",
      });

      // Optional: save user info
      Cookies.set("user", JSON.stringify(data.user));
  // ✅ Save user ID
      Cookies.set("userId", data.user.id, {
        expires: 1,
        sameSite: "strict",
      });
      Cookies.set("userrole", data.user.role);

      setlogin(true);
 
    

    } catch (error) {
      console.error("Login error:", (error as Error).message);
      alert("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm">
            Sign In
          </h1>
          <p className="text-sm text-gray-500">
            Enter your email and password to sign in
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Email */}
            <div>
              <Label>Email *</Label>
              <Input
                placeholder="info@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div>
              <Label>Password *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword ? <EyeIcon /> : <EyeCloseIcon />}
                </span>
              </div>
            </div>

            {/* Remember */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox checked={isChecked} onChange={setIsChecked} />
                <span className="text-sm text-gray-700">
                  Keep me logged in
                </span>
              </div>

              <Link
                to="/reset-password"
                className="text-sm text-brand-500"
              >
                Forgot password?
              </Link>
            </div>
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">
                  {login === true ? "You have succefully login" :""}
                </span>
              </div>
            </div>
            {login === false ? <Button className="w-full" size="sm" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button> : 
            <div>
            <Button 
            onClick={() => {
            window.location.href = "http://localhost:3000";
            }} className="w-full" size="sm" disabled={loading}>
              Return back to home page
            </Button>
            <Link
                to="/"
                className="text-sm text-brand-500"
              >
            <Button 
              className="w-full mt-3" size="sm" disabled={loading}>
              Open Dashboard
            </Button>
            </Link>
            </div>
            }

          </div>
        </form>

        <div className="mt-5 text-center">
          <p className="text-sm text-gray-700">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-brand-500">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
