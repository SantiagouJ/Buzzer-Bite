import RegisterForm from "../../../components/register-form";

type UsuarioRegisterPageProps = {
  searchParams: Promise<{ error?: string; detail?: string }>;
};

export default function UsuarioRegisterPage({ searchParams }: UsuarioRegisterPageProps) {
  return <RegisterForm role="consumer" searchParams={searchParams} />;
}
