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
  LanguageInputId,
  LanguageOutput,
  LanguageOutputId,
  getSupportedInputLanguages,
  getSupportedOutputLanguages,
} from "~/types/language.type";
import clsx from "clsx";
import { parseWithZod } from "@conform-to/zod";
import { translateText } from "~/models/translate.server";
import { useEffect, useState } from "react";

type LoaderData = {
  supportedInputLanguages: Array<LanguageInput>;
  supportedOutputLanguages: Array<LanguageOutput>;
  inputLanguage: LanguageInputId;
  outputLanguage: LanguageOutputId;
  outputText: string;
};

const languageSchema = z.object({
  inputLanguage: z.enum(["auto", "en", "es", "de"]).default("auto"),
  outputLanguage: z.enum(["en", "es", "de"]).default("en"),
});

const translateTextSchema = z.object({
  inputText: z
    .string({ required_error: "Provide a text" })
    .min(3, "Provide a text at least of 3 characters")
    .max(200, "Provide a text at max of 50 characters"),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const supportedInputLanguages = getSupportedInputLanguages();
  const supportedOutputLanguages = getSupportedOutputLanguages();
  const searchParams = new URL(request.url).searchParams;

  const submissionLanguage = await parseWithZod(searchParams, {
    schema: languageSchema,
  });

  if (submissionLanguage.status !== "success") {
    throw new Error("Invalid search params, never reach here");
  }

  const inputLanguage = submissionLanguage.value.inputLanguage;
  const outputLanguage = submissionLanguage.value.outputLanguage;

  const submissionTranslateText = await parseWithZod(searchParams, {
    schema: translateTextSchema,
  });

  if (submissionTranslateText.status !== "success") {
    return {
      supportedInputLanguages,
      supportedOutputLanguages,
      inputLanguage,
      outputLanguage,
      outputText: "",
    };
  }

  const outputText = await translateText(
    inputLanguage,
    outputLanguage,
    submissionTranslateText.value.inputText
  );

  return {
    supportedInputLanguages,
    supportedOutputLanguages,
    inputLanguage,
    outputLanguage,
    outputText: outputText,
  };
}

export default function Index() {
  const {
    supportedInputLanguages,
    supportedOutputLanguages,
    outputText,
    inputLanguage: inputLanguageLoader,
    outputLanguage: outputLanguageLoader,
  } = useLoaderData<LoaderData>();
  const [searchParams] = useSearchParams();

  const [inputText, setInputText] = useState(
    searchParams.get("inputText") ?? ""
  );

  const [inputLanguage, setInputLanguage] = useState(inputLanguageLoader);
  const [outputLanguage, setOutputLanguage] = useState(outputLanguageLoader);

  useEffect(() => {
    setInputLanguage(inputLanguageLoader);
    setOutputLanguage(outputLanguageLoader);
  }, [inputLanguageLoader, outputLanguageLoader]);

  const navigation = useNavigation();
  const submit = useSubmit();
  const debouncedSubmit = useDebounceCallback(submit, 500);

  const isTranslating = navigation.state !== "idle";

  const handleChangeForm = (e: React.FormEvent<HTMLFormElement>) => {
    const target = e.target;

    if (inputText.length > 3) {
      if (target instanceof HTMLTextAreaElement) {
        debouncedSubmit(e.currentTarget);
      } else {
        submit(e.currentTarget);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setOutputLanguage(inputLanguage as LanguageOutputId);
    setInputLanguage(outputLanguage);
    setInputText(outputText);

    submit(
      {
        inputLanguage: outputLanguage,
        outputLanguage: inputLanguage,
        inputText: outputText,
      },
      {
        method: "get",
      }
    );
  };

  return (
    <Form
      className="flex flex-col gap-4 items-center md:flex-row md:gap-4 md:items-center"
      onChange={handleChangeForm}
      onSubmit={handleSubmit}
    >
      <Card className="w-full">
        <CardHeader>
          <Select
            name="inputLanguage"
            value={inputLanguage}
            onValueChange={(value) =>
              setInputLanguage(value as LanguageInputId)
            }
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
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
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
          type="submit"
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
            value={outputLanguage}
            onValueChange={(value) =>
              setOutputLanguage(value as LanguageOutputId)
            }
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
