import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSignUp } from "@/modules/user/user.hooks";
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage";
import { EyeIcon, EyeOffIcon } from "@/shared/components/PasswordVisibilityIcons";

type RegistrationFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  repeatPassword: string;
  agreeToTerms: boolean;
};

const RegistrationPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const { mutate: signUp, isPending, error } = useSignUp();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      repeatPassword: "",
      agreeToTerms: true,
    },
  });

  /**
   * todo : form submit valid hole login data console e dekhano
   * @param data
   * method : onSubmit
   * parameter : data - RegistrationFormValues, react-hook-form validate kore pathano value gulo
   */
  const onSubmit = (data: RegistrationFormValues) => {
    signUp(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      },
      {
        onSuccess: () => {
          toast.success("Registration successful");
          navigate("/login");
        },
        onError: (err) => {
          toast.error(
            getApiErrorMessage(err, "Registration failed. Please try again."),
          );
        },
      },
    );
  };

  return (
    <section className="_social_registration_wrapper _layout_main_wrapper">
      <div className="_shape_one">
        <img src="/images/shape1.svg" alt="" className="_shape_img" />
        <img src="/images/dark_shape.svg" alt="" className="_dark_shape" />
      </div>
      <div className="_shape_two">
        <img src="/images/shape2.svg" alt="" className="_shape_img" />
        <img
          src="/images/dark_shape1.svg"
          alt=""
          className="_dark_shape _dark_shape_opacity"
        />
      </div>
      <div className="_shape_three">
        <img src="/images/shape3.svg" alt="" className="_shape_img" />
        <img
          src="/images/dark_shape2.svg"
          alt=""
          className="_dark_shape _dark_shape_opacity"
        />
      </div>
      <div className="_social_registration_wrap">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
              <div className="_social_registration_right">
                <div className="_social_registration_right_image">
                  <img src="/images/registration.png" alt="Image" />
                </div>
                <div className="_social_registration_right_image_dark">
                  <img src="/images/registration1.png" alt="Image" />
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
              <div className="_social_registration_content">
                <div className="_social_registration_right_logo _mar_b28">
                  <img
                    src="/images/logo.svg"
                    alt="Image"
                    className="_right_logo"
                  />
                </div>
                <p className="_social_registration_content_para _mar_b8">
                  Get Started Now
                </p>
                <h4 className="_social_registration_content_title _titl4 _mar_b50">
                  Registration
                </h4>
                <button
                  type="button"
                  className="_social_registration_content_btn _mar_b40"
                >
                  <img
                    src="/images/google.svg"
                    alt="Image"
                    className="_google_img"
                  />{" "}
                  <span>Register with google</span>
                </button>
                <div className="_social_registration_content_bottom_txt _mar_b40">
                  {" "}
                  <span>Or</span>
                </div>
                <form
                  className="_social_registration_form"
                  onSubmit={handleSubmit(onSubmit)}
                  noValidate
                >
                  <div className="row">
                    <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">
                          First Name
                        </label>
                        <input
                          type="text"
                          className="form-control _social_registration_input"
                          {...register("firstName", {
                            required: "First name is required",
                            minLength: {
                              value: 2,
                              message:
                                "First name must be at least 2 characters",
                            },
                          })}
                        />
                        {errors.firstName && (
                          <span className="text-danger">
                            {errors.firstName.message}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">
                          Last Name
                        </label>
                        <input
                          type="text"
                          className="form-control _social_registration_input"
                          {...register("lastName", {
                            required: "Last name is required",
                            minLength: {
                              value: 2,
                              message:
                                "Last name must be at least 2 characters",
                            },
                          })}
                        />
                        {errors.lastName && (
                          <span className="text-danger">
                            {errors.lastName.message}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">
                          Email
                        </label>
                        <input
                          type="email"
                          className="form-control _social_registration_input"
                          {...register("email", {
                            required: "Email is required",
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: "Please enter a valid email address",
                            },
                          })}
                        />
                        {errors.email && (
                          <span className="text-danger">
                            {errors.email.message}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">
                          Password
                        </label>
                        <div style={{ position: "relative" }}>
                          <input
                            type={showPassword ? "text" : "password"}
                            className="form-control _social_registration_input"
                            style={{ paddingRight: "44px" }}
                            {...register("password", {
                              required: "Password is required",
                              minLength: {
                                value: 6,
                                message:
                                  "Password must be at least 6 characters",
                              },
                            })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                            style={{
                              position: "absolute",
                              right: "12px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                          </button>
                        </div>
                        {errors.password && (
                          <span className="text-danger">
                            {errors.password.message}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">
                          Repeat Password
                        </label>
                        <div style={{ position: "relative" }}>
                          <input
                            type={showRepeatPassword ? "text" : "password"}
                            className="form-control _social_registration_input"
                            style={{ paddingRight: "44px" }}
                            {...register("repeatPassword", {
                              required: "Please repeat your password",
                              validate: (value) =>
                                value === watch("password") ||
                                "Passwords do not match",
                            })}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowRepeatPassword((prev) => !prev)
                            }
                            aria-label={
                              showRepeatPassword
                                ? "Hide password"
                                : "Show password"
                            }
                            style={{
                              position: "absolute",
                              right: "12px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {showRepeatPassword ? <EyeOffIcon /> : <EyeIcon />}
                          </button>
                        </div>
                        {errors.repeatPassword && (
                          <span className="text-danger">
                            {errors.repeatPassword.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-12 col-xl-12 col-md-12 col-sm-12">
                      <div className="form-check _social_registration_form_check">
                        <input
                          className="form-check-input _social_registration_form_check_input"
                          type="radio"
                          id="flexRadioDefault2"
                          {...register("agreeToTerms", {
                            required: "You must agree to terms & conditions",
                          })}
                          defaultChecked
                        />
                        <label
                          className="form-check-label _social_registration_form_check_label"
                          htmlFor="flexRadioDefault2"
                        >
                          I agree to terms &amp; conditions
                        </label>
                        {errors.agreeToTerms && (
                          <span className="text-danger">
                            {errors.agreeToTerms.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {error && (
                    <div className="row">
                      <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
                        <span className="text-danger">
                          {getApiErrorMessage(
                            error,
                            "Registration failed. Please try again.",
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="row">
                    <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
                      <div className="_social_registration_form_btn _mar_t40 _mar_b60">
                        <button
                          type="submit"
                          className="_social_registration_form_btn_link _btn1"
                          disabled={isPending}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {isPending ? "Registering..." : "Register now"}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
                <div className="row">
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="_social_registration_bottom_txt">
                      <p className="_social_registration_bottom_txt_para">
                        Already have an account?{" "}
                        <Link to="/login">Sign in</Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegistrationPage;
