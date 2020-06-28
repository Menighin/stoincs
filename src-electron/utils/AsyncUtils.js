class AsyncUtils {

    static timeout(duration) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }

}

export default AsyncUtils;
