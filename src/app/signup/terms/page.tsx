"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const TERMS_AGREED_KEY = "signup-terms-agreed";

export default function SignupTermsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeNotice, setAgreeNotice] = useState(false);
  const [agreeLocation, setAgreeLocation] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const isRequiredNotice = searchParams.get("required") === "1";

  const allRequiredAgreed = useMemo(
    () => agreeTerms && agreePrivacy && agreeNotice && agreeLocation,
    [agreeLocation, agreeNotice, agreePrivacy, agreeTerms],
  );

  const handleToggleAll = (checked: boolean) => {
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeNotice(checked);
    setAgreeLocation(checked);
  };

  const handleConfirm = () => {
    if (!allRequiredAgreed) {
      return;
    }
    sessionStorage.setItem(TERMS_AGREED_KEY, "true");
    router.replace("/signup");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl bg-slate-200/80 p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">약관 동의</h1>
          <p className="mt-1 text-xs text-slate-600">
            모든 필수 약관에 동의해야 회원가입이 가능합니다.
          </p>
          {isRequiredNotice ? (
            <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
              회원가입을 계속하려면 약관 동의가 필요합니다.
            </p>
          ) : null}

          <section className="mt-4 rounded-xl border border-slate-300/70 bg-white/70 p-3 text-xs text-slate-600">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <label className="flex items-start gap-2 text-sm font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={allRequiredAgreed}
                    onChange={(event) => handleToggleAll(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>전체 약관에 동의합니다 (필수)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowDetails((prev) => !prev)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  aria-expanded={showDetails}
                >
                  {showDetails ? "자세히 보기 ▲" : "자세히 보기 ▼"}
                </button>
              </div>

              {showDetails ? (
                <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(event) => setAgreeTerms(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <span className="font-semibold text-slate-800">
                        서비스 이용약관 동의 (필수)
                      </span>
                      <span className="mt-1 block text-slate-500">
                        위치 로드시스템 서비스 이용을 위한 기본 약관에 동의합니다.
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-400">
                        ※ 본 약관에는 서비스 이용 제한, 계정 관리, 책임 범위에 관한
                        내용이 포함됩니다.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(event) => setAgreePrivacy(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <span className="font-semibold text-slate-800">
                        개인정보 처리방침 동의 (필수)
                      </span>
                      <span className="mt-1 block text-slate-500">
                        회원가입 및 서비스 제공을 위해 개인정보를 수집·이용하는 것에
                        동의합니다.
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-400">
                        수집 항목: 아이디, 비밀번호, 이름, 전화번호, 소속, 부서
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-400">
                        ※ 수집된 개인정보는 서비스 목적 외로 사용되지 않으며, 관련
                        법령에 따라 안전하게 관리됩니다.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={agreeNotice}
                      onChange={(event) => setAgreeNotice(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <span className="font-semibold text-slate-800">
                        서비스 관련 안내 수신 동의 (필수)
                      </span>
                      <span className="mt-1 block text-slate-500">
                        시스템 공지 및 서비스 운영과 관련된 안내를 수신하는 것에
                        동의합니다.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={agreeLocation}
                      onChange={(event) => setAgreeLocation(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <span className="font-semibold text-slate-800">
                        위치정보 이용약관 동의 (필수)
                      </span>
                      <span className="mt-1 block text-slate-500">
                        일지 및 관측소 위치 기반 서비스 제공을 위해 위치 정보를
                        활용하는 것에 동의합니다.
                      </span>
                    </span>
                  </label>
                </div>
              ) : null}
            </div>

            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
              본 서비스는 위치 기반 기능을 포함하고 있으며, 모든 약관은 서비스
              이용을 위해 필수적으로 적용됩니다.
            </p>
          </section>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!allRequiredAgreed}
            className="mt-4 w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            모두 동의하고 계속
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span>이미 계정이 있나요?</span>
            <Link href="/login" className="text-slate-600 hover:text-slate-900">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
