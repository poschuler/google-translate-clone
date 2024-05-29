import { LoaderFunctionArgs } from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { useDebounceCallback } from "usehooks-ts";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import {
  LanguageInput,
  LanguageOutput,
  getSupportedInputLanguages,
  getSupportedOutputLanguages,
} from "~/types/language.type";
import clsx from "clsx";
import { parseWithZod } from "@conform-to/zod";
import { jsonWithError, redirectWithError } from "remix-toast";
import { translateText } from "~/models/translate.server";
import { useEffect, useState } from "react";

type LoaderData = {
  supportedInputLanguages: Array<LanguageInput>;
  supportedOutputLanguages: Array<LanguageOutput>;
  outputText: string;
};

const languageSchema = z.object({
  inputLanguage: z.enum(["auto", "en", "es", "de"]),
  outputLanguage: z.enum(["en", "es", "de"]),
});

const translateTextSchema = z.object({
  inputText: z
    .string({ required_error: "Provide a text" })
    .min(3, "Provide a text at least of 3 characters")
    .max(50, "Provide a text at max of 50 characters"),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const supportedInputLanguages = getSupportedInputLanguages();
  const supportedOutputLanguages = getSupportedOutputLanguages();
  const searchParams = new URL(request.url).searchParams;

  const submissionTranslateText = await parseWithZod(searchParams, {
    schema: translateTextSchema,
  });

  if (submissionTranslateText.status !== "success") {
    return {
      supportedInputLanguages,
      supportedOutputLanguages,
      outputText: "",
    };
  }

  const submissionLanguage = await parseWithZod(searchParams, {
    schema: languageSchema,
  });

  if (submissionLanguage.status !== "success") {
    return redirectWithError("/", "Invalid search params");
  }

  const outputText = await translateText(
    submissionLanguage.value.inputLanguage,
    submissionLanguage.value.outputLanguage,
    submissionTranslateText.value.inputText
  );

  return {
    supportedInputLanguages,
    supportedOutputLanguages,
    outputText: outputText ?? "",
  };
}

export default function Index() {
  const { supportedInputLanguages, supportedOutputLanguages, outputText } =
    useLoaderData<LoaderData>();
  const [searchParams] = useSearchParams();
  const inputText = searchParams.get("inputText") ?? "";
  const inputLanguage = searchParams.get("inputLanguage") ?? "auto";
  const outputLanguage = searchParams.get("outputLanguage") ?? "en";

  const [inputTextState, setInputTextState] = useState(inputText);
  const [inputLanguageState, setInputLanguageState] = useState(inputLanguage);
  const [outputLanguageState, setOutputLanguageState] =
    useState(outputLanguage);

  useEffect(() => {
    setOutputLanguageState(outputLanguage);
  }, [outputLanguage]);

  useEffect(() => {
    setInputLanguageState(inputLanguage);
  }, [inputLanguage]);

  useEffect(() => {
    setInputTextState(inputText);
  }, [inputText]);

  const handleSwapLanguages = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    const inputTemp = inputLanguageState;
    setInputLanguageState(outputLanguageState);
    setOutputLanguageState(inputTemp);
    setInputTextState(outputText);
  };

  const navigation = useNavigation();
  const submit = useSubmit();
  const debouncedSubmit = useDebounceCallback(submit, 500);

  const isTranslating = navigation.state !== "idle";

  const handleChangeForm = (e: React.FormEvent<HTMLFormElement>) => {
    const target = e.target;

    if (target instanceof HTMLTextAreaElement) {
      debouncedSubmit(e.currentTarget);
    } else {
      submit(e.currentTarget);
    }
  };

  return (
    <Form
      className="flex flex-col gap-4 items-center md:flex-row md:gap-4 md:items-center"
      onChange={handleChangeForm}
    >
      <Card className="w-full">
        <CardHeader>
          <Select
            name="inputLanguage"
            value={inputLanguageState}
            onValueChange={(value) => setInputLanguageState(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {supportedInputLanguages.map((language) => (
                <SelectItem key={language.id} value={language.id}>
                  {language.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <CardDescription className="sr-only">Input Text</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Write something"
            className="resize-none"
            name="inputText"
            value={inputTextState}
            onChange={(e) => setInputTextState(e.target.value)}
            required
          />
        </CardContent>
      </Card>

      <div>
        <Button size={"icon"} variant={"ghost"} type="submit">
          <Loader2
            className={clsx(
              "h-4 w-4 animate-spin",
              isTranslating ? "opacity-100" : "opacity-0"
            )}
          />
        </Button>

        <Button
          size={"icon"}
          variant={"default"}
          onClick={handleSwapLanguages}
          disabled={
            inputLanguage === "auto" ||
            isTranslating ||
            inputLanguage === outputLanguage
          }
        >
          <ArrowRightLeft />
        </Button>
      </div>

      <Card className="w-full">
        <CardHeader>
          <Select
            name="outputLanguage"
            value={outputLanguageState}
            onValueChange={(value) => setOutputLanguageState(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {supportedOutputLanguages.map((language) => (
                <SelectItem key={language.id} value={language.id}>
                  {language.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <CardDescription className="sr-only">Output Text</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            className="resize-none"
            placeholder="Translated text"
            readOnly={true}
            value={isTranslating ? "Translating..." : outputText}
          />
        </CardContent>
      </Card>
    </Form>
  );
}
