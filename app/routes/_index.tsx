import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, useFetcher, useLoaderData } from "@remix-run/react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
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
  LanguageOutputId,
  getSupportedInputLanguages,
  getSupportedOutputLanguages,
} from "~/types/language.type";
import { parseWithZod } from "@conform-to/zod";
import { translateText } from "~/models/translate.server";
import clsx from "clsx";

type LoaderData = {
  supportedInputLanguages: Array<LanguageInput>;
  supportedOutputLanguages: Array<LanguageOutput>;
  defaultOutputLanguage: LanguageOutputId;
};

const translateSchema = z.object({
  inputLanguage: z.enum(["auto", "en", "es", "de"]),
  outputLanguage: z.enum(["en", "es", "de"]),
  text: z
    .string({ required_error: "Provide a text" })
    .min(3, "Provide a text at least of 3 characters")
    .max(50, "Provide a text at max of 50 characters"),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const supportedInputLanguages = getSupportedInputLanguages();
  const supportedOutputLanguages = getSupportedOutputLanguages();

  return {
    supportedInputLanguages,
    supportedOutputLanguages,
    defaultOutputLanguage: supportedOutputLanguages[0].id,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: translateSchema });

  if (submission.status !== "success") {
    return json(submission.reply());
  }

  const outputText = await translateText(
    submission.value.inputLanguage,
    submission.value.outputLanguage,
    submission.value.text
  );

  return json({ outputText });
}

export default function Index() {
  const {
    defaultOutputLanguage,
    supportedInputLanguages,
    supportedOutputLanguages,
  } = useLoaderData<LoaderData>();

  const translateFetcher = useFetcher<typeof action>();
  const [selectedInputLanguage, setSelectedInputLanguage] =
    useState<string>("auto");
  const [selectedOutputLanguage, setSelectedOutputLanguage] = useState<string>(
    defaultOutputLanguage
  );

  const [inputText, setInputText] = useState<string>("");
  const [debouncedInputText, setDebouncedInputText] = useDebounceValue(
    inputText,
    500
  );

  const [outputText, setOutputText] = useState("");

  useEffect(() => {
    setDebouncedInputText(inputText);
  }, [inputText, setDebouncedInputText]);

  useEffect(() => {
    if (
      translateFetcher.state === "idle" &&
      translateFetcher.data?.outputText
    ) {
      setOutputText(translateFetcher.data.outputText);
    }
  }, [translateFetcher]);

  useEffect(() => {
    translateFetcher.submit(
      {
        _action: "translate",
        inputLanguage: selectedInputLanguage,
        outputLanguage: selectedOutputLanguage,
        text: debouncedInputText,
      },
      {
        method: "POST",
      }
    );
  }, [selectedInputLanguage, selectedOutputLanguage, debouncedInputText]);

  const handleSwapLanguages = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    const temp = selectedInputLanguage;
    setSelectedInputLanguage(selectedOutputLanguage);
    setSelectedOutputLanguage(temp);

    const tempText = debouncedInputText;
    setInputText(outputText);
    setOutputText(tempText);
  };

  const isTranslating = translateFetcher.state !== "idle";

  return (
    <translateFetcher.Form
      className="flex flex-col gap-4 items-center md:flex-row md:gap-4 md:items-center"
      method="post"
    >
      <Card className="w-full">
        <CardHeader>
          <Select
            name="inputText"
            value={selectedInputLanguage}
            onValueChange={(e) => {
              setSelectedInputLanguage(e);
            }}
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
            required
            onChange={(e) => {
              setInputText(e.target.value);
            }}
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
            selectedInputLanguage === "auto" ||
            isTranslating ||
            selectedInputLanguage === selectedOutputLanguage
          }
        >
          <ArrowRightLeft />
        </Button>
      </div>

      <Card className="w-full">
        <CardHeader>
          <Select
            name="outputLanguage"
            value={selectedOutputLanguage}
            onValueChange={(e) => {
              setSelectedOutputLanguage(e);
            }}
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
            value={isTranslating ? "Translating" : outputText}
          />
        </CardContent>
      </Card>
    </translateFetcher.Form>
  );
}
