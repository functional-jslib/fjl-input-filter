InputFilterResult
    result Boolean
    validInputs [String, Result]
    invalidInputs [String, Result]
    messages [String, []]

On server:
    1.  Build inputs obj (hard coded obj or imported from a text file (JSON or other etc.))
    2.  Scan incoming form data for keys from inputs obj (loop through keys from 'a' and pull values from 'b')
    3.  Validate incoming data with input objs
        ```
        if result is true
			perform success action (most likely some IO or other action)
		else
			perform failure action (most likely returning the appropriate 
			error data for frontend to display error messages to user).
        ```

On Frontend:
loop through returned (invalidinputs or messages)
	for each populated 
		get associated form field
		add messages as error messages near form field


