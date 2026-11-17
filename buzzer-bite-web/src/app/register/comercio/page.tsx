import RegisterForm from "../../../components/register-form";

type ComercioRegisterPageProps = {
  searchParams: Promise<{ error?: string; detail?: string }>;
};

export default function ComercioRegisterPage({ searchParams }: ComercioRegisterPageProps) {
  return <RegisterForm role="merchant" searchParams={searchParams} />;
}
