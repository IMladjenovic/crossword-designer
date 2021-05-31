import './App.css';
import React, {useState} from "react";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from '@material-ui/core/styles';
import Landing from './Landing';
import Design from "./Design";
import Play from "./Play";

const useStyles = makeStyles({
    root: {
        background: 'linear-gradient(155deg, #41b3ac 10%, #e8a87c 85%)',
        color: 'white',
        padding: '10px 40px',
        margin: 0,
        alignContent: "center"
    },
    borderGradient: {
        background: 'linear-gradient(45deg, #e8a87c 30%, #e8a87c 90%)',
        margin: 0,
        marginBottom: 10,
        padding: "5px"
    }
});

export const PageHeader = ({ title, children, classes }) => (
    <Grid item xs={12} >
        <Box my={4} className={classes.root}>
            <Box className={classes.test1}>
                <Grid container item justify="space-between" spacing={0}>
                    <Grid item>
                        <Typography variant="h4" component="div" >{title}</Typography>
                    </Grid>
                    <Grid item>
                        {children}
                    </Grid>
                </Grid>
            </Box>
        </Box>
        <Box my={4} className={classes.borderGradient}>
        </Box>
    </Grid>
)

function App() {
    const [designGame, setDesignGame] = useState(false);
    const [playGame, setPlayGame] = useState(false);
    const classes = useStyles();

    return (
        <div className="App" >
            <Grid container spacing={0} style={{ minHeight: '100vh', marginBottom: '-20px' }} >
                <Grid item xs={12} >
                    {playGame ?
                        <Play /> :
                     designGame ?
                        <Design classesParent={classes} /> :
                        <Landing classesParent={classes} title="Play and Design Crosswords"
                                 setPlayGame={setPlayGame}
                                 setDesignGame={setDesignGame} />
                    }
                </Grid>
            </Grid>
        </div>
    );
}

export default App;
