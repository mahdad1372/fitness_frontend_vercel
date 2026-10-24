import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";

export default function SignUpForm() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    gender: "male",
    height: "180",
    weight: "85",
    age: "25",
    role: "USER",
    smoke:1
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isChecked) {
      alert("Please accept terms and conditions");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://fitness-backend-15563671567.europe-west8.run.app/users/adduser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          password: formData.password,
          gender: formData.gender,
          height: Number(formData.height),
          weight: Number(formData.weight),
          age: Number(formData.age),
          role: formData.role,
          smoke:formData.smoke
        }),
      });

      if (!response.ok) {
        throw new Error("Signup failed");
      }

      alert("User registered successfully 🎉");
      navigate("/signin");
    } catch (error) {
      console.error(error);
      alert("Failed to register user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm">
          Sign Up
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Create your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* First & Last Name */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label>First Name *</Label>
              <Input
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              
            />
          </div>

          {/* Password */}
          <div>
            <Label>Password *</Label>
            <div className="relative">
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                {showPassword ? (
                  <EyeIcon className="size-5 fill-gray-500" />
                ) : (
                  <EyeCloseIcon className="size-5 fill-gray-500" />
                )}
              </span>
            </div>
          </div>

          {/* Gender */}
          {/* <div>
            <Label>Gender *</Label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="femail">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div> */}

          {/* Height, Weight, Age */}
          {/* <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <Label>Height (cm) *</Label>
              <Input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                
              />
            </div>
            <div>
              <Label>Weight (kg) *</Label>
              <Input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                
              />
            </div>
            <div>
              <Label>Age *</Label>
              <Input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                
            
              />
            </div>
          </div> */}

          {/* Role */}
          <div>
            <Label>Role *</Label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="COACH">Coach</option>
            </select>
          </div>

          {/* Terms */}
          <div className="flex items-center gap-3">
            <Checkbox
              className="w-5 h-5"
              checked={isChecked}
              onChange={setIsChecked}
            />
            <p className="text-sm text-gray-500">
              I agree to the terms and privacy policy
            </p>
          </div>

          {/* Submit */}
          <button
            disabled={loading}
            className="w-full py-3 text-sm font-medium text-white rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-5 text-sm text-center text-gray-700">
          Already have an account?{" "}
          <Link to="/signin" className="text-brand-500">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
