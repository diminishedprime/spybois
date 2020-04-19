import * as React from "react";
import classnames from "classnames";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useStyles } from "../Game";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";

interface Props {}

const CopyGameToClipboard: React.FC<Props> = () => {
  const classes = useStyles();
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    if (copied) {
      const id = window.setTimeout(() => {
        setCopied(false);
      }, 1500);
      return () => {
        window.clearTimeout(id);
      };
    }
  }, [copied]);

  return (
    <section className={classnames(classes.centeredSection, classes.copy)}>
      <CopyToClipboard
        text={document.location.href}
        onCopy={(_: string, result: boolean) => {
          if (result === true) {
            setCopied(true);
          }
        }}
      >
        <section
          className={classnames(classes.centeredSection, classes.columns)}
        >
          <Button
            variant="contained"
            color="default"
            startIcon={<FileCopyIcon />}
          >
            Copy link to game
          </Button>
          {copied && <Typography>Copied!</Typography>}
        </section>
      </CopyToClipboard>
    </section>
  );
};

export default CopyGameToClipboard;
