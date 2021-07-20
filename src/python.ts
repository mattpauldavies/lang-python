import {parser} from "lezer-python"
import {continuedIndent, indentNodeProp, foldNodeProp, foldInside, LezerLanguage, LanguageSupport} from "@codemirror/language"
import {styleTags, tags as t} from "@codemirror/highlight"

/// A language provider based on the [Lezer Python
/// parser](https://github.com/lezer-parser/python), extended with
/// highlighting and indentation information.
export const pythonLanguage = LezerLanguage.define({
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Body: continuedIndent({except: /^\s*(else|elif|except|finally)\b/}),
        TupleExpression: continuedIndent(),
        DictionaryExpression: continuedIndent(),
        ArrayExpression: continuedIndent(),
        Script: context => {
          if (context.pos + /\s*/.exec(context.textAfter)![0].length < context.node.to)
            return context.continue()
          let endBody = null
          for (let cur = context.node;;) {
            let last = cur.lastChild
            if (!last || last.type.name != "Body" || last.to != cur.to) break
            endBody = cur = last
          }
          return endBody ? context.lineIndent(context.state.doc.lineAt(endBody.from)) + context.unit : null
        }
      }),
      foldNodeProp.add({
        "Body ArrayExpression DictionaryExpression": foldInside
      }),
      styleTags({
        "async '*' '**' FormatConversion": t.modifier,
        "for while if elif else try except finally return raise break continue with pass assert await yield": t.controlKeyword,
        "in not and or is del": t.operatorKeyword,
        "import from def class global nonlocal lambda": t.definitionKeyword,
        "with as print": t.keyword,
        self: t.self,
        Boolean: t.bool,
        None: t.null,
        VariableName: t.variableName,
        "CallExpression/VariableName": t.function(t.variableName),
        "FunctionDefinition/VariableName": t.function(t.definition(t.variableName)),
        "ClassDefinition/VariableName": t.definition(t.className),
        PropertyName: t.propertyName,
        "CallExpression/MemberExpression/PropertyName": t.function(t.propertyName),
        Comment: t.lineComment,
        Number: t.number,
        String: t.string,
        FormatString: t.special(t.string),
        UpdateOp: t.updateOperator,
        ArithOp: t.arithmeticOperator,
        BitOp: t.bitwiseOperator,
        CompareOp: t.compareOperator,
        AssignOp: t.definitionOperator,
        Ellipsis: t.punctuation,
        At: t.meta,
        "( )": t.paren,
        "[ ]": t.squareBracket,
        "{ }": t.brace,
        ".": t.derefOperator,
        ", ;": t.separator
      })
    ],
  }),
  languageData: {
    closeBrackets: {brackets: ["(", "[", "{", "'", '"', "'''", '"""']},
    commentTokens: {line: "#"},
    indentOnInput: /^\s*([\}\]\)]|else:|elif |except |finally:)$/
  }
})

/// Python language support.
export function python() {
  return new LanguageSupport(pythonLanguage)
}
