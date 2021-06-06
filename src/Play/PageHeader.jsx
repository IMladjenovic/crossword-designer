import React, {useRef, useState} from "react";

import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";

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
);

export default PageHeader;
